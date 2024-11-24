import { IsEmail, IsEnum, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrganizationRole } from "../../common/enums";

export class AddUserToOrganizationDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email of the user to add to the organization",
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
    description: "Role of the user in the organization",
  })
  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole = OrganizationRole.MEMBER;
}
