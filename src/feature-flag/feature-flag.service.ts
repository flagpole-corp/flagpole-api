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
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const [featureFlag] = await this.featureFlagModel.create([
      {
        ...createFeatureFlagDto,
        project: new Types.ObjectId(projectId),
        organization: new Types.ObjectId(organizationId),
      },
    ]);

    await this.featureFlagGateway.emitFlagUpdate(featureFlag);
    return featureFlag;
  }

  async findAll(
    projectId: string,
    organizationId: string
  ): Promise<FeatureFlag[]> {
    console.log("FeatureFlagService.findAll called with:", {
      projectId,
      organizationId,
    });

    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    console.log("Project found:", project);

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    console.log("Searching for flags with query:", {
      project: new Types.ObjectId(projectId),
    });

    const totalFlags = await this.featureFlagModel.countDocuments();
    console.log("Total flags in collection:", totalFlags);

    const flags = await this.featureFlagModel.find({
      project: new Types.ObjectId(projectId),
      $or: [{ isArchived: { $ne: true } }, { isArchived: { $exists: false } }],
    });

    console.log("Flags found:", flags);
    return flags;
  }

  async findOne(id: string, projectId: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagModel.findOne({
      _id: new Types.ObjectId(id),
      project: new Types.ObjectId(projectId),
      $or: [{ isArchived: { $ne: true } }, { isArchived: { $exists: false } }],
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
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const flag = await this.featureFlagModel.findOne({
      _id: new Types.ObjectId(id),
      project: new Types.ObjectId(projectId),
      isArchived: { $ne: true },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

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
    projectId: string,
    organizationId: string
  ): Promise<FeatureFlag> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const updatedFlag = await this.featureFlagModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          project: new Types.ObjectId(projectId),
          $or: [
            { isArchived: { $ne: true } },
            { isArchived: { $exists: false } },
          ],
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

  async archive(
    id: string,
    projectId: string,
    organizationId: string
  ): Promise<void> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const result = await this.featureFlagModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        project: new Types.ObjectId(projectId),
        isArchived: { $ne: true },
      },
      { $set: { isArchived: true } }
    );

    if (!result) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    await this.featureFlagGateway.emitFlagDeletion(id);
  }
}
