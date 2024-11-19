import { Controller, Post, UseGuards, Request, Get } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request as ExpressRequest } from "express";
import { AuthService } from "./auth.service";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { UserDocument } from "./schemas/user.schema";
import { LoginDto } from "./dto/login.dto";

interface RequestWithUser extends ExpressRequest {
  user: UserDocument;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard("local"))
  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({
    status: 200,
    description: "Returns JWT token and user information",
  })
  @ApiBody({ type: LoginDto })
  async login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard("google"))
  @Get("google")
  @ApiOperation({ summary: "Login with Google" })
  @ApiResponse({
    status: 302,
    description: "Redirects to Google login page",
  })
  async googleAuth() {
    // This method is empty as it just initiates the Google OAuth flow
  }

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  @ApiOperation({ summary: "Google auth callback" })
  @ApiResponse({
    status: 200,
    description:
      "Returns JWT token and user information after successful Google login",
  })
  async googleAuthRedirect(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }
}
