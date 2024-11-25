import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FeatureFlag } from "./schemas/feature-flag.schema";
import { CreateFeatureFlagDto } from "./dto/feature-flag.dto";
import { Project } from "../projects/schemas/project.schema";
import { FeatureFlagGateway } from "./feature-flag.gateway";

@Injectable()
export class FeatureFlagService {
  constructor(
    @InjectModel(FeatureFlag.name) private featureFlagModel: Model<FeatureFlag>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private readonly featureFlagGateway: FeatureFlagGateway
  ) {}

  async create(
    createFeatureFlagDto: CreateFeatureFlagDto,
    projectId: string,
    organizationId: string
  ): Promise<FeatureFlag> {
    // Verify project belongs to organization
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const featureFlag = new this.featureFlagModel({
      ...createFeatureFlagDto,
      project: new Types.ObjectId(projectId),
    });

    const savedFlag = await featureFlag.save();
    await this.featureFlagGateway.emitFlagUpdate(savedFlag);
    return savedFlag;
  }

  async findAll(
    projectId: string,
    organizationId: string
  ): Promise<FeatureFlag[]> {
    // Verify project belongs to organization
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return this.featureFlagModel.find({
      project: new Types.ObjectId(projectId),
    });
  }

  async findOne(id: string, projectId: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagModel.findOne({
      _id: new Types.ObjectId(id),
      project: new Types.ObjectId(projectId),
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    return flag;
  }

  async toggle(
    id: string,
    projectId: string,
    organizationId: string
  ): Promise<FeatureFlag> {
    // Verify project belongs to organization
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const flag = await this.findOne(id, projectId);
    flag.isEnabled = !flag.isEnabled;
    const updatedFlag = await flag.save();
    await this.featureFlagGateway.emitFlagUpdate(updatedFlag);
    return updatedFlag;
  }

  async delete(id: string, projectId: string): Promise<void> {
    const result = await this.featureFlagModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        project: new Types.ObjectId(projectId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    await this.featureFlagGateway.emitFlagDeletion(id);
  }

  async update(
    id: string,
    updateData: Partial<CreateFeatureFlagDto>,
    projectId: string
  ): Promise<FeatureFlag> {
    const updatedFlag = await this.featureFlagModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          project: new Types.ObjectId(projectId),
        },
        { $set: updateData },
        { new: true }
      )
      .exec();

    if (!updatedFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    await this.featureFlagGateway.emitFlagUpdate(updatedFlag);
    return updatedFlag;
  }
}
