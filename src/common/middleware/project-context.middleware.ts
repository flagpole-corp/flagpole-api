import { Injectable, NestMiddleware } from "@nestjs/common";
import { RequestWithUser } from "../types/request";
import { Response, NextFunction } from "express";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "../../users/schemas/user.schema";

@Injectable()
export class ProjectContextMiddleware implements NestMiddleware {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    if (req.user?.currentProject) {
      req.projectId = new Types.ObjectId(req.user.currentProject);
    }
    next();
  }
}
