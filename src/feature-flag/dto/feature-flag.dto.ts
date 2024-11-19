import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsObject,
  IsOptional,
  IsArray,
} from "class-validator";

export class CreateFeatureFlagDto {
  @ApiProperty({ example: "new-feature" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Enables the new awesome feature" })
  @IsString()
  description: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ example: ["development", "staging"] })
  @IsArray()
  @IsOptional()
  environments?: string[];
}
