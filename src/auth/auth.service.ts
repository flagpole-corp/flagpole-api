import { Injectable } from "@nestjs/common";
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
      // Convert to object and remove password before returning
      const userObject = user.toObject();
      delete userObject.password;
      return userObject;
    }

    return null;
  }

  async login(user: UserDocument) {
    const payload = {
      email: user.email,
      sub: user._id,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateGoogleUser(details: { email: string; googleId: string }) {
    let user = await this.userModel.findOne({ email: details.email });

    if (user) {
      // Update googleId if it doesn't exist
      if (!user.googleId) {
        user.googleId = details.googleId;
        user = await user.save();
      }
      return user;
    }

    // Create new user if they don't exist
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
}
