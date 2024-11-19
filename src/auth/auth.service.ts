import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./schemas/user.schema";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateGoogleUser(details: { email: string; googleId: string }) {
    const user = await this.userModel.findOne({ email: details.email });
    if (user) {
      user.googleId = details.googleId;
      await user.save();
      return user;
    }

    const newUser = new this.userModel({
      email: details.email,
      googleId: details.googleId,
      roles: ["user"],
    });
    return newUser.save();
  }
}
