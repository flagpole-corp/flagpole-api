import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ApiKey } from "../schemas/api-key.schema";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedException("API key is required");
    }

    const keyDoc = await this.apiKeyModel
      .findOne({
        key: apiKey,
        isActive: true,
      })
      .populate("organization project");

    if (!keyDoc) {
      throw new UnauthorizedException("Invalid API key");
    }

    // Update last used timestamp
    keyDoc.lastUsed = new Date();
    await keyDoc.save();

    // Attach organization and project to request
    request.organizationId = new Types.ObjectId(keyDoc.organization._id);
    request.projectId = new Types.ObjectId(keyDoc.project._id);

    return true;
  }
}
