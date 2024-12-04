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
import { RequestWithUser } from "../common/types/request";
import { ProjectContextGuard } from "src/common/guards/project-context.guard";

@ApiTags("feature-flags")
@ApiBearerAuth()
@Controller("feature-flags")
@UseGuards(JwtAuthGuard, ProjectContextGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
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
    @Body() createFeatureFlagDto: CreateFeatureFlagDto,
    @Req() req: RequestWithUser
  ): Promise<FeatureFlag> {
    if (!projectId) {
      throw new UnauthorizedException("Project ID is required");
    }
    if (!req.user.currentOrganization) {
      throw new UnauthorizedException("Organization context is required");
    }
    return this.featureFlagService.create(
      createFeatureFlagDto,
      projectId,
      req.user.currentOrganization.toString()
    );
  }

  @Get()
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
    console.log("Request details:", {
      projectId,
      organizationId: req.user.currentOrganization,
      availableProjectIds: [
        "674fab2457b33ba902d8f5d6",
        "674fab2457b33ba902d8f5d7",
        "674fab2457b33ba902d8f5d8",
        "674fab2457b33ba902d8f5d9",
        "674fab2457b33ba902d8f5da",
      ],
    });

    if (!projectId) {
      throw new UnauthorizedException("Project ID is required");
    }
    if (!req.user.currentOrganization) {
      throw new UnauthorizedException("Organization context is required");
    }

    const flags = await this.featureFlagService.findAll(
      projectId,
      req.user.currentOrganization.toString()
    );

    console.log("FeatureFlagController.findAll returning:", flags);
    return flags;
  }

  @Patch(":id/toggle")
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
}
