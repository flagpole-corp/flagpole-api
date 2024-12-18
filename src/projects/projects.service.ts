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
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async findAll(organizationId: string) {
    console.log(
      "ProjectsService - findAll starting with organizationId:",
      organizationId
    );

    // Always filter by organization
    const projects = await this.projectModel.find({
      organization: new Types.ObjectId(organizationId),
      status: { $ne: ProjectStatus.ARCHIVED },
    });
    console.log("ProjectsService - found projects:", projects);
    return projects;
  }

  async findOne(projectId: string, organizationId: string) {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId), // Security check
      status: { $ne: ProjectStatus.ARCHIVED },
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

  async update(
    id: string,
    organizationId: string,
    updateData: UpdateProjectDto
  ) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        organization: new Types.ObjectId(organizationId),
        status: { $ne: ProjectStatus.ARCHIVED },
      },
      { $set: updateData },
      { new: true }
    );

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async softDelete(id: string, organizationId: string) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        organization: new Types.ObjectId(organizationId),
        status: { $ne: ProjectStatus.ARCHIVED },
      },
      { status: ProjectStatus.ARCHIVED },
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
        status: { $ne: ProjectStatus.ARCHIVED },
      })
      .sort({ createdAt: -1 });
  }

  async findUserProjects(userId: string) {
    return this.projectModel
      .find({
        "members.user": new Types.ObjectId(userId),
        status: { $ne: ProjectStatus.ARCHIVED },
      })
      .sort({ createdAt: -1 });
  }
}
