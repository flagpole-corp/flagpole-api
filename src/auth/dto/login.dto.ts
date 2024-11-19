import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User's email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "password123", description: "User's password" })
  @IsString()
  @MinLength(6)
  password: string;
}
