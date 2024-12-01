import { Injectable, NestMiddleware } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../../users/schemas/user.schema";
import { RequestWithUser } from "../types/request";
import { Response, NextFunction } from "express";
import { toObjectId } from "../utils/mongoose";

@Injectable()
export class OrganizationContextMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) {}

  async use(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.userId) {
        const user = await this.userModel.findById(req.user.userId);
        if (user?.currentOrganization) {
          req.organizationId = toObjectId(user.currentOrganization.toString());
        }
      }
    } catch (error) {
      console.error("Error in OrganizationContextMiddleware:", error);
    }
    next();
  }
}
