import { IsString, IsOptional, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrganizationDto {
  @ApiProperty({
    example: "Acme Corporation",
    description: "The name of the organization",
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: "acme-corp",
    description: "URL-friendly name of the organization",
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    example: { theme: "dark" },
    description: "Organization-specific settings",
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
