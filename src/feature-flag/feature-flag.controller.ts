import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FeatureFlagService } from "./feature-flag.service";
import { CreateFeatureFlagDto } from "./dto/feature-flag.dto";

@ApiTags("feature-flags")
@ApiBearerAuth()
@Controller("feature-flags")
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  async create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    const flag = await this.featureFlagService.create(createFeatureFlagDto);
    return flag;
  }

  @Get()
  findAll() {
    return this.featureFlagService.findAll();
  }

  @Patch(":id/toggle")
  async toggle(@Param("id") id: string) {
    return this.featureFlagService.toggle(id);
  }
}
