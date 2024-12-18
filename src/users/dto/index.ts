// src/users/dto/index.ts
import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
} from "class-validator";
import { OrganizationRole } from "../../common/enums";

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole = OrganizationRole.MEMBER;

  @IsArray()
  @IsOptional()
  projects?: string[] = [];
}

export class AcceptInvitationDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateUserRoleDto {
  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}

export class UpdateUserProjectsDto {
  @IsArray()
  projects: string[];
}
