import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomBytes } from "crypto";
import { ApiKey } from "./schemas/api-key.schema";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";

@Injectable()
export class ApiKeysService {
  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>) {}

  private generateApiKey(): string {
    // Format: fp_live_xxxxxxxxxxxxxxxxxxxxxx
    return `fp_live_${randomBytes(24).toString("hex")}`;
  }

  async create(createApiKeyDto: CreateApiKeyDto, organizationId: string) {
    const key = this.generateApiKey();

    const apiKey = new this.apiKeyModel({
      key,
      name: createApiKeyDto.name,
      organization: organizationId,
      project: createApiKeyDto.projectId,
    });

    return apiKey.save();
  }

  async findAll(organizationId: string, projectId: string) {
    return this.apiKeyModel
      .find({ organization: organizationId, project: projectId })
      .populate("project", "name");
    // .select("-key"); // Don't send the actual key in list
  }

  async deactivate(id: string, organizationId: string) {
    return this.apiKeyModel.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { isActive: false },
      { new: true }
    );
  }

  async updateLastUsed(key: string) {
    return this.apiKeyModel.findOneAndUpdate(
      { key },
      { lastUsed: new Date() },
      { new: true }
    );
  }
}
