import { IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UpdateProjectDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Name can only contain letters, numbers, hyphens, and underscores",
  })
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
