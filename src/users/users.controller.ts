// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationAuthGuard } from "../common/guards/organization-auth.guard";
import { CurrentOrganization } from "../common/decorators/organization.decorator";
import { UsersService } from "./users.service";
import {
  InviteUserDto,
  AcceptInvitationDto,
  UpdateUserRoleDto,
  UpdateUserProjectsDto,
} from "./dto";

@Controller("users")
@UseGuards(JwtAuthGuard, OrganizationAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@CurrentOrganization() organizationId: string) {
    return this.usersService.findByOrganization(organizationId);
  }

  @Post("invite")
  async invite(
    @CurrentOrganization() organizationId: string,
    @Body() inviteUserDto: InviteUserDto
  ) {
    return this.usersService.inviteUser(
      inviteUserDto.email,
      organizationId,
      inviteUserDto.role,
      inviteUserDto.projects
    );
  }

  @Post("accept-invitation")
  async acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.usersService.acceptInvitation(
      acceptInvitationDto.token,
      acceptInvitationDto.password
    );
  }

  @Patch(":id/role")
  async updateRole(
    @Param("id") id: string,
    @CurrentOrganization() organizationId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto
  ) {
    return this.usersService.updateUserRole(
      id,
      organizationId,
      updateUserRoleDto.role
    );
  }

  @Patch(":id/projects")
  async updateProjects(
    @Param("id") id: string,
    @Body() updateUserProjectsDto: UpdateUserProjectsDto
  ) {
    return this.usersService.updateUserProjects(
      id,
      updateUserProjectsDto.projects
    );
  }

  @Delete(":id")
  async deleteUser(
    @Param("id") id: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.usersService.deleteUser(id, organizationId);
  }

  @Post(":id/resend-invitation")
  async resendInvitation(
    @Param("id") id: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.usersService.resendInvitation(id, organizationId);
  }
}
