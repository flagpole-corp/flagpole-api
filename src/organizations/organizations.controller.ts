import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto, AddUserToOrganizationDto } from "./dto";
import { RequestWithUser } from "../common/types/request";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new organization" })
  create(
    @Request() req: RequestWithUser,
    @Body() createOrganizationDto: CreateOrganizationDto
  ) {
    return this.organizationsService.create(
      createOrganizationDto,
      req.user._id.toString()
    );
  }

  @Post(":id/users")
  @ApiOperation({ summary: "Add a user to the organization" })
  addUser(
    @Param("id") id: string,
    @Body() addUserDto: AddUserToOrganizationDto
  ) {
    return this.organizationsService.addUserToOrganization(
      id,
      addUserDto.email,
      addUserDto.role
    );
  }

  @Post("switch/:id")
  @ApiOperation({ summary: "Switch current organization" })
  switchOrganization(
    @Request() req: RequestWithUser,
    @Param("id") organizationId: string
  ) {
    return this.organizationsService.switchUserOrganization(
      req.user._id.toString(),
      organizationId
    );
  }
}
