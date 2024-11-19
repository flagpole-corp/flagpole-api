import { Injectable, NotFoundException } from "@nestjs/common";
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
    await this.featureFlagGateway.emitFlagUpdate(savedFlag);
    return savedFlag;
  }

  async findAll(): Promise<FeatureFlag[]> {
    const flags = await this.featureFlagModel.find().exec();
    await this.featureFlagGateway.emitInitialFlags(flags);
    return flags;
  }

  async findOne(id: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagModel.findById(id).exec();
    if (!flag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    return flag;
  }

  async toggle(id: string): Promise<FeatureFlag> {
    const flag = await this.findOne(id);
    flag.isEnabled = !flag.isEnabled;
    const updatedFlag = await flag.save();
    await this.featureFlagGateway.emitFlagUpdate(updatedFlag);
    return updatedFlag;
  }

  async delete(id: string): Promise<void> {
    const result = await this.featureFlagModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    await this.featureFlagGateway.emitFlagDeletion(id);
  }

  async update(
    id: string,
    updateData: Partial<CreateFeatureFlagDto>
  ): Promise<FeatureFlag> {
    const updatedFlag = await this.featureFlagModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    await this.featureFlagGateway.emitFlagUpdate(updatedFlag);
    return updatedFlag;
  }
}
