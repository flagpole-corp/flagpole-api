import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel
      .findOne({ email })
      .select("+password")
      .exec();

    if (!user) {
      return null;
    }

    // Check if user has a password (they might be Google-auth only)
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
    if (!user.currentOrganization && user.organizations?.length > 0) {
      user.currentOrganization = user.organizations[0].organization;
      await user.save();
    }

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      currentOrganization: user.currentOrganization?.toString(),
    };

    console.log({ payload });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        currentOrganization: user.currentOrganization?.toString(),
        organizations: user.organizations,
      },
    };
  }

  async validateGoogleUser(details: { email: string; googleId: string }) {
    let user = await this.userModel.findOne({ email: details.email });

    if (user) {
      if (!user.googleId) {
        user.googleId = details.googleId;
        user = await user.save();
      }
      return user;
    }

    // Create new user
    const newUser = new this.userModel({
      email: details.email,
      googleId: details.googleId,
      provider: "google",
      roles: ["user"],
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
      .select("-password") // Exclude password
      .populate("organizations.organization", "name slug subscriptionStatus")
      .exec();

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    console.log("getCurrentUser", { user });
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      currentOrganization: user.currentOrganization?.toString(),
      organizations: user.organizations.map((org) => ({
        ...org,
        organization: org.organization.toString(),
      })),
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
