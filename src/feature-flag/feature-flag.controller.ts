import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Headers,
  UseGuards,
  HttpStatus,
  Req,
  UnauthorizedException,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FeatureFlagService } from "./feature-flag.service";
import { CreateFeatureFlagDto } from "./dto/feature-flag.dto";
import { FeatureFlag } from "./schemas/feature-flag.schema";
import { RequestWithApiKey, RequestWithUser } from "../common/types/request";
import { ProjectContextGuard } from "src/common/guards/project-context.guard";
import { ApiKeyGuard } from "src/api-keys/guards/api-key.guard";

@ApiTags("feature-flags")
@Controller("feature-flags")
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @UseGuards(JwtAuthGuard, ProjectContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new feature flag" })
  @ApiHeader({
    name: "x-project-id",
    description: "ID of the current project",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Feature flag created successfully",
    type: FeatureFlag,
  })
  async create(
    @Headers("x-project-id") projectId: string,
    @Headers("x-organization-id") orgId: string,
    @Body() createFeatureFlagDto: CreateFeatureFlagDto,
    @Req() req: RequestWithUser
  ): Promise<FeatureFlag> {
    if (!projectId) {
      throw new UnauthorizedException("Project ID is required");
    }
    const organizationId = orgId || req.user.currentOrganization?.toString();

    if (!organizationId) {
      throw new UnauthorizedException("Organization context is required");
    }

    return this.featureFlagService.create(
      createFeatureFlagDto,
      projectId,
      organizationId
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, ProjectContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all feature flags for the current project" })
  @ApiHeader({
    name: "x-project-id",
    description: "ID of the current project",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns all feature flags",
    type: [FeatureFlag],
  })
  async findAll(
    @Headers("x-project-id") projectId: string,
    @Req() req: RequestWithUser
  ): Promise<FeatureFlag[]> {
    if (!projectId) {
      throw new UnauthorizedException("Project ID is required");
    }
    if (!req.user.currentOrganization) {
      throw new UnauthorizedException("Organization context is required");
    }

    const flags = this.featureFlagService.findAll(
      projectId,
      req.user.currentOrganization.toString()
    );

    console.log("FeatureFlagController.findAll returning:", flags);
    return flags;
  }

  @Patch(":id/toggle")
  @UseGuards(JwtAuthGuard, ProjectContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle feature flag status" })
  @ApiHeader({
    name: "x-project-id",
    description: "ID of the current project",
    required: true,
  })
  @ApiParam({ name: "id", description: "Feature flag ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Feature flag toggled successfully",
    type: FeatureFlag,
  })
  async toggle(
    @Headers("x-project-id") projectId: string,
    @Param("id") id: string,
    @Req() req: RequestWithUser
  ): Promise<FeatureFlag> {
    if (!projectId) {
      throw new UnauthorizedException("Project ID is required");
    }
    if (!req.user.currentOrganization) {
      throw new UnauthorizedException("Organization context is required");
    }
    return this.featureFlagService.toggle(
      id,
      projectId,
      req.user.currentOrganization.toString()
    );
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, ProjectContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update feature flag" })
  async update(
    @Param("id") id: string,
    @Headers("x-project-id") projectId: string,
    @Headers("x-organization-id") orgId: string,
    @Body() updateFeatureFlagDto: Partial<CreateFeatureFlagDto>,
    @Req() req: RequestWithUser
  ): Promise<FeatureFlag> {
    console.log("patch :id", id);
    if (!projectId) {
      throw new UnauthorizedException("ProjectId is required");
    }

    if (!orgId) {
      throw new UnauthorizedException("OrganizationId is required");
    }

    return this.featureFlagService.update(
      id,
      updateFeatureFlagDto,
      projectId,
      orgId
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, ProjectContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete feature flag" })
  async delete(
    @Param("id") id: string,
    @Headers("x-project-id") projectId: string,
    @Headers("x-organization-id") orgId: string,
    @Req() req: RequestWithUser
  ): Promise<void> {
    if (!projectId) {
      throw new UnauthorizedException("ProjectId is required");
    }

    if (!orgId) {
      throw new UnauthorizedException("OrganizationId is required");
    }
    await this.featureFlagService.archive(id, projectId, orgId);
  }

  // SDK Routes (API Key Auth)
  @Get("sdk")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Get all feature flags for SDK" })
  @ApiHeader({
    name: "x-api-key",
    description: "API Key for SDK authentication",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns all feature flags",
    type: [FeatureFlag],
  })
  async findAllSdk(@Req() req: RequestWithApiKey): Promise<FeatureFlag[]> {
    return this.featureFlagService.findAll(
      req.projectId.toString(),
      req.organizationId.toString()
    );
  }
}
