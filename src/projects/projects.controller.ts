import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentOrganization } from "src/common/decorators/organization.decorator";
import { OrganizationAuthGuard } from "src/common/guards/organization-auth.guard";
import { ProjectsService } from "./projects.service";
import { RequestWithUser } from "src/common/types/request";
import { CreateProjectDto } from "./dto";
import { SubscriptionLimitsGuard } from "src/common/guards/subscription-limits.guard";

@Controller("projects")
@UseGuards(JwtAuthGuard, OrganizationAuthGuard, SubscriptionLimitsGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    console.log("Headers:", req.headers); // Debug log
    console.log("User:", req.user); // Debug log
    console.log(
      "Organization ID from header:",
      req.headers["x-organization-id"]
    ); // Debug log
    return this.projectsService.findAll(
      req.headers["x-organization-id"] as string
    );
  }

  @Post()
  async create(
    @CurrentOrganization() organizationId: string,
    @Req() req: RequestWithUser,
    @Body() createProjectDto: CreateProjectDto
  ) {
    return this.projectsService.create(
      createProjectDto,
      organizationId,
      req.user._id.toString()
    );
  }
}
