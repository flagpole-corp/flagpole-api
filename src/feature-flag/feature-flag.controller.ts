import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FeatureFlagService } from "./feature-flag.service";
import { CreateFeatureFlagDto } from "./dto/feature-flag.dto";
import { FeatureFlag } from "./schemas/feature-flag.schema";

@ApiTags("feature-flags")
@ApiBearerAuth()
@Controller("feature-flags")
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @ApiOperation({ summary: "Create a new feature flag" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Feature flag created successfully",
    type: FeatureFlag,
  })
  async create(
    @Body() createFeatureFlagDto: CreateFeatureFlagDto
  ): Promise<FeatureFlag> {
    return this.featureFlagService.create(createFeatureFlagDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all feature flags" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns all feature flags",
    type: [FeatureFlag],
  })
  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagService.findAll();
  }

  @Patch(":id/toggle")
  @ApiOperation({ summary: "Toggle feature flag status" })
  @ApiParam({ name: "id", description: "Feature flag ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Feature flag toggled successfully",
    type: FeatureFlag,
  })
  async toggle(@Param("id") id: string): Promise<FeatureFlag> {
    return this.featureFlagService.toggle(id);
  }
}
