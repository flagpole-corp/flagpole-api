import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { RequestWithUser } from "../types/request";
import { Project } from "src/projects/schemas/project.schema";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class ProjectContextGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId = request.headers["x-project-id"];
    const organizationId = request.headers["x-organization-id"];

    console.log("ProjectContextGuard - Initial check:", {
      projectId: request.headers["x-project-id"],
      organizationId: request.headers["x-organization-id"],
    });

    console.log("ProjectContextGuard checking request:", {
      headers: request.headers,
      user: request.user,
    });

    if (!projectId) {
      throw new ForbiddenException(
        "No project context found. Please select a project first."
      );
    }

    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      organization: new Types.ObjectId(organizationId),
    });

    console.log("Found project:", project);

    if (!project) {
      throw new ForbiddenException("Invalid project context");
    }

    if (!request.headers["x-project-id"]) {
      console.log("ProjectContextGuard: No project ID found in headers");
      throw new ForbiddenException(
        "No project context found. Please select a project first."
      );
    }

    return true;
  }
}
