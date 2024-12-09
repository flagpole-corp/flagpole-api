import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organization } from "../schemas/organization.schema";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "../../common/enums/subscription.enum";
import { Project } from "src/projects/schemas/project.schema";
import { FeatureFlag } from "src/feature-flag/schemas/feature-flag.schema";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
    @InjectModel(FeatureFlag.name)
    private featureFlagModel: Model<FeatureFlag>
  ) {}

  async startTrial(organizationId: string): Promise<Organization> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const updatedOrg = await this.organizationModel.findByIdAndUpdate(
      organizationId,
      {
        plan: SubscriptionPlan.TRIAL,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt,
      },
      { new: true }
    );

    if (!updatedOrg) {
      throw new Error("Organization not found");
    }

    return updatedOrg;
  }

  async upgradePlan(
    organizationId: string,
    plan: SubscriptionPlan
  ): Promise<Organization> {
    const updatedOrg = await this.organizationModel.findByIdAndUpdate(
      organizationId,
      {
        plan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
      },
      { new: true }
    );

    if (!updatedOrg) {
      throw new Error("Organization not found");
    }

    return updatedOrg;
  }

  async checkLimits(organizationId: string): Promise<{
    projectsUsed: number;
    usersUsed: number;
    flagsPerProject: Record<string, number>;
  }> {
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get projects count
    const projectsUsed = await this.projectModel.countDocuments({
      organization: organizationId,
    });

    // Get users count
    const usersUsed = organization.members.length;

    // Get flags count per project
    const projects = await this.projectModel.find({
      organization: organizationId,
    });
    const flagsPerProject: Record<string, number> = {};

    await Promise.all(
      projects.map(async (project) => {
        const flagCount = await this.featureFlagModel.countDocuments({
          project: project._id,
        });
        flagsPerProject[project._id.toString()] = flagCount;
      })
    );

    return {
      projectsUsed,
      usersUsed,
      flagsPerProject,
    };
  }
}
