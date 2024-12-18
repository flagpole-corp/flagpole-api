import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organization } from "../../organizations/schemas/organization.schema";
import { Project } from "../../projects/schemas/project.schema";
import { FeatureFlag } from "../../feature-flag/schemas/feature-flag.schema";
import { User } from "../../users/schemas/user.schema";
import {
  PLAN_LIMITS,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../../common/enums/subscription.enum";

@Injectable()
export class SubscriptionLimitsGuard implements CanActivate {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(FeatureFlag.name) private featureFlagModel: Model<FeatureFlag>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers["x-organization-id"];

    console.log(
      "SubscriptionLimitsGuard - checking organization:",
      organizationId
    );

    const organization = await this.organizationModel.findById(organizationId);

    console.log("Found organization:", {
      id: organization?._id,
      plan: organization?.subscription?.plan,
      status: organization?.subscription?.status,
    });

    if (!organization) {
      throw new ForbiddenException("Organization not found");
    }

    const { plan, status, trialEndsAt } = organization.subscription;

    if (!Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) {
      throw new ForbiddenException(`Invalid subscription plan: ${plan}`);
    }

    // Check subscription status
    if (status === SubscriptionStatus.EXPIRED) {
      throw new ForbiddenException("Subscription has expired");
    }

    // Check trial expiration
    if (
      status === SubscriptionStatus.TRIAL &&
      trialEndsAt &&
      trialEndsAt < new Date()
    ) {
      await this.organizationModel.findByIdAndUpdate(organizationId, {
        "subscription.status": SubscriptionStatus.EXPIRED,
      });
      throw new ForbiddenException("Trial period has expired");
    }

    const planLimits = PLAN_LIMITS[plan as SubscriptionPlan];

    if (!planLimits) {
      throw new ForbiddenException("Invalid subscription plan");
    }

    // Check limits based on the request path and method
    const path = request.route.path;
    const method = request.method;

    // Project creation check
    if (path.includes("/projects") && method === "POST") {
      const projectCount = await this.projectModel.countDocuments({
        organization: organizationId,
      });
      if (projectCount >= planLimits.maxProjects) {
        throw new ForbiddenException("Project limit reached for current plan");
      }
    }

    // Feature flag creation check
    if (path.includes("/feature-flags") && method === "POST") {
      const projectId = request.headers["x-project-id"];
      const flagCount = await this.featureFlagModel.countDocuments({
        project: projectId,
      });
      if (flagCount >= planLimits.maxFlagsPerProject) {
        throw new ForbiddenException(
          "Feature flag limit reached for current plan"
        );
      }
    }

    // User addition check
    if (path.includes("/organizations/members") && method === "POST") {
      const userCount = await this.userModel.countDocuments({
        "organizations.organization": organizationId,
      });
      if (userCount >= planLimits.maxUsers) {
        throw new ForbiddenException("User limit reached for current plan");
      }
    }

    return true;
  }
}
