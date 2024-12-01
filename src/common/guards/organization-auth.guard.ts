import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "../../users/schemas/user.schema";

@Injectable()
export class OrganizationAuthGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log("Starting guard check");

    // Get _id instead of userId
    const userId = request.user._id;
    const organizationId = request.headers["x-organization-id"];

    console.log("Guard Check:", { userId, organizationId });

    if (!organizationId) {
      throw new ForbiddenException("Organization ID is required");
    }

    const user = await this.userModel.findById(userId);
    console.log("Found user:", user); // Debug log

    if (!user) {
      throw new ForbiddenException("User not found");
    }

    const isMember = user.organizations.some(
      (org) => org.organization.toString() === organizationId
    );

    console.log("Is member check:", {
      userOrgs: user.organizations.map((org) => org.organization.toString()),
      requestedOrg: organizationId,
      isMember,
    });

    if (!isMember) {
      throw new ForbiddenException("User does not belong to this organization");
    }

    return true;
  }
}
