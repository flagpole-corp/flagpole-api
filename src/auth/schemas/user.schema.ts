import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

@Schema({
  timestamps: true, // Adds createdAt and updatedAt fields
  collection: "users", // Explicitly set collection name
})
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ select: false }) // Exclude password from query results by default
  password?: string;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Prop({ unique: true, sparse: true }) // sparse allows multiple null values
  googleId?: string;

  @Prop()
  googleAccessToken?: string;

  @Prop()
  googleRefreshToken?: string;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
