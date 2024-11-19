import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FeatureFlag } from "./schemas/feature-flag.schema";
import { CreateFeatureFlagDto } from "./dto/feature-flag.dto";
import { FeatureFlagGateway } from "./feature-flag.gateway";

@Injectable()
export class FeatureFlagService {
  constructor(
    @InjectModel(FeatureFlag.name) private featureFlagModel: Model<FeatureFlag>,
    private featureFlagGateway: FeatureFlagGateway
  ) {}

  async create(
    createFeatureFlagDto: CreateFeatureFlagDto
  ): Promise<FeatureFlag> {
    const flag = new this.featureFlagModel(createFeatureFlagDto);
    const savedFlag = await flag.save();
    this.featureFlagGateway.broadcastFlagUpdate(savedFlag);
    return savedFlag;
  }

  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagModel.find().exec();
  }

  async toggle(id: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagModel.findById(id);
    flag.isEnabled = !flag.isEnabled;
    const updatedFlag = await flag.save();
    this.featureFlagGateway.broadcastFlagUpdate(updatedFlag);
    return updatedFlag;
  }
}
