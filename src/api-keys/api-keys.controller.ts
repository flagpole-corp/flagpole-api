import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
  Headers,
} from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationAuthGuard } from "../common/guards/organization-auth.guard";
import { CurrentOrganization } from "../common/decorators/organization.decorator";

@Controller("api-keys")
@UseGuards(JwtAuthGuard, OrganizationAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.apiKeysService.create(createApiKeyDto, organizationId);
  }

  @Get()
  async findAll(
    @CurrentOrganization() organizationId: string,
    @Headers("x-project-id") projectId: string
  ) {
    return this.apiKeysService.findAll(organizationId, projectId);
  }

  @Patch(":id/deactivate")
  async deactivate(
    @Param("id") id: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.apiKeysService.deactivate(id, organizationId);
  }
}
