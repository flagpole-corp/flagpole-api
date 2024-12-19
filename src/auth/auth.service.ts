import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import * as bcrypt from "bcrypt";
import { UserStatus } from "src/common/enums";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel
      .findOne({
        email,
        status: UserStatus.ACTIVE,
      })
      .select("+password")
      .exec();

    if (!user) {
      return null;
    }

    if (!user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const userObject = user.toObject();
      delete userObject.password;
      return userObject;
    }

    return null;
  }

  async login(user: UserDocument) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active");
    }

    if (!user.currentOrganization && user.organizations?.length > 0) {
      user.currentOrganization = user.organizations[0].organization;
      await user.save();
    }

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      currentOrganization: user.currentOrganization?.toString(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        status: user.status,
        currentOrganization: user.currentOrganization?.toString(),
        organizations: user.organizations,
      },
    };
  }

  async validateGoogleUser(details: { email: string; googleId: string }) {
    const user = await this.userModel.findOne({
      email: details.email,
      status: { $ne: UserStatus.PENDING },
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = details.googleId;
        await user.save();
      }
      return user;
    }

    // Create new user
    const newUser = new this.userModel({
      email: details.email,
      googleId: details.googleId,
      provider: "google",
      status: UserStatus.ACTIVE,
    });

    return newUser.save();
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async createLocalUser(email: string, password: string) {
    const hashedPassword = await this.hashPassword(password);
    const user = new this.userModel({
      email,
      password: hashedPassword,
      provider: "local",
    });
    return user.save();
  }

  async getCurrentUser(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select("-password")
      .populate("organizations.organization", "name")
      .populate("projects.project", "name")
      .exec();

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      currentOrganization: user.currentOrganization?.toString(),
      organizations: user.organizations.map((org) => ({
        organization: org.organization.toString(),
        role: org.role,
        joinedAt: org.joinedAt,
      })),
      projects: user.projects,
    };
  }

  async revokeToken(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          loggedOut: true,
          lastLogoutAt: new Date(),
          refreshToken: null,
        },
        $push: {
          securityEvents: {
            type: "logout",
            timestamp: new Date(),
          },
        },
      }
    );
  }
}
