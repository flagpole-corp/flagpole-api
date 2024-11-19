import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole, AuthProvider } from "../schemas/user.schema";

export class CreateUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsOptional() // Optional because of Google auth
  password?: string;

  @ApiPropertyOptional({ example: "John" })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe" })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ enum: AuthProvider, default: AuthProvider.LOCAL })
  @IsEnum(AuthProvider)
  @IsOptional()
  provider?: AuthProvider;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    default: [UserRole.USER],
  })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[];
}
