import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project } from "./schemas/project.schema";
import { User } from "../users/schemas/user.schema";
import { CreateProjectDto, AddProjectMemberDto } from "./dto";
import { ProjectStatus, ProjectRole } from "../common/enums";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async findAll(organizationId: string) {
    // Always filter by organization
    return this.projectModel.find({
      organization: new Types.ObjectId(organizationId),
      status: { $ne: ProjectStatus.DELETED },
    });
  }

  async findOne(projectId: string, organizationId: string) {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId), // Security check
      status: { $ne: ProjectStatus.DELETED },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async create(
    createProjectDto: CreateProjectDto,
    organizationId: string,
    userId: string
  ) {
    const project = new this.projectModel({
      ...createProjectDto,
      organization: new Types.ObjectId(organizationId),
      members: [
        {
          user: new Types.ObjectId(userId),
          role: ProjectRole.OWNER,
          addedAt: new Date(),
        },
      ],
    });

    return project.save();
  }

  async update(id: string, updateData: Partial<CreateProjectDto>) {
    const project = await this.projectModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async softDelete(id: string) {
    const project = await this.projectModel.findByIdAndUpdate(
      id,
      { status: ProjectStatus.DELETED },
      { new: true }
    );

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async addMember(projectId: string, addMemberDto: AddProjectMemberDto) {
    const user = await this.userModel.findOne({ email: addMemberDto.email });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const existingMember = project.members.find(
      (member) => member.user.toString() === user._id.toString()
    );

    if (existingMember) {
      throw new ConflictException("User is already a member of this project");
    }

    project.members.push({
      user: user._id,
      role: addMemberDto.role,
      addedAt: new Date(),
    });

    return project.save();
  }

  async removeMember(projectId: string, userId: string) {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $pull: { members: { user: new Types.ObjectId(userId) } } },
      { new: true }
    );
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    return this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(projectId),
        "members.user": new Types.ObjectId(userId),
      },
      { $set: { "members.$.role": role } },
      { new: true }
    );
  }

  async findByOrganization(organizationId: string) {
    return this.projectModel
      .find({
        organization: new Types.ObjectId(organizationId),
        status: { $ne: ProjectStatus.DELETED },
      })
      .sort({ createdAt: -1 });
  }

  async findUserProjects(userId: string) {
    return this.projectModel
      .find({
        "members.user": new Types.ObjectId(userId),
        status: { $ne: ProjectStatus.DELETED },
      })
      .sort({ createdAt: -1 });
  }
}