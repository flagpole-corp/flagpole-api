import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request as ExpressRequest } from "express";
import { AuthService } from "./auth.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserDocument } from "../users/schemas/user.schema";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

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
    if (!req.user) {
      throw new UnauthorizedException("User not found in request");
    }
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
    if (!req.user) {
      throw new UnauthorizedException("User not found in request");
    }
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user information" })
  @ApiResponse({
    status: 200,
    description: "Returns current user information",
  })
  async getCurrentUser(@Request() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException("User not found in request");
    }
    return this.authService.getCurrentUser(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Log user out" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "User logged out successfully",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error logging out",
  })
  async logout(@Request() req: RequestWithUser): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException("User not found in request");
    }
    await this.authService.revokeToken(req.user.id);
  }
}
