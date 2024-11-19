import { Controller, Post, UseGuards, Request, Get } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard("local"))
  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Returns JWT token" })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard("google"))
  @Get("google")
  @ApiOperation({ summary: "Login with Google" })
  async googleAuth() {}

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  @ApiOperation({ summary: "Google auth callback" })
  async googleAuthRedirect(@Request() req) {
    return this.authService.login(req.user);
  }
}
