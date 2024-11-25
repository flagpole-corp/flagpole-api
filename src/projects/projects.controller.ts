import {
  Body,
  Controller,
  Get,
  Post,
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
import { ApiOperation } from "@nestjs/swagger";

@Controller("projects")
@UseGuards(JwtAuthGuard, OrganizationAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(@CurrentOrganization() organizationId: string) {
    return this.projectsService.findAll(organizationId);
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
      req.user.userId
    );
  }
}
