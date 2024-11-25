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
    const userId = request.user.userId;
    const organizationId =
      request.params.organizationId || request.body.organizationId;

    if (!organizationId) {
      throw new ForbiddenException("Organization ID is required");
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new ForbiddenException("User not found");
    }

    const isMember = user.organizations.some(
      (org) => org.organization.toString() === organizationId
    );

    if (!isMember) {
      throw new ForbiddenException("User does not belong to this organization");
    }

    return true;
  }
}
