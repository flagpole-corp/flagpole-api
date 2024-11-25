import { IsEmail, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "../../common/enums";

export class AddProjectMemberDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ProjectRole })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}
