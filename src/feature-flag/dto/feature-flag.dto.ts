import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsObject,
  IsOptional,
  IsArray,
} from "class-validator";

export class CreateFeatureFlagDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  environments?: string[];
}
