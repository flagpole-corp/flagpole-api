import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../common/enums/auth";

export class AuthResponseDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token",
  })
  access_token: string;

  @ApiProperty({
    example: {
      id: "5f9d4a3b2c1d0a3b4c5d6e7f",
      email: "user@example.com",
      roles: ["user"],
      firstName: "John",
      lastName: "Doe",
    },
  })
  user: {
    id: string;
    email: string;
    roles: UserRole[];
    firstName?: string;
    lastName?: string;
  };
}
