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

  @Prop({
    select: false, // Excludes password from queries by default
    required: function () {
      // Only required for local auth
      return this.provider === "local";
    },
  })
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

UserSchema.index({ email: 1, provider: 1 });

UserSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.roles.includes(role);
};

UserSchema.methods.isAdmin = function (): boolean {
  return this.roles.includes(UserRole.ADMIN);
};

UserSchema.pre("save", function (next) {
  // You can add any pre-save logic here
  // For example, updating lastLogin if it's a new user
  if (this.isNew) {
    this.lastLogin = new Date();
  }
  next();
});

export interface UserMethods {
  hasRole(role: UserRole): boolean;
  isAdmin(): boolean;
}

export type UserDocument = User & UserMethods & Document;

// Export interfaces for DTO creation
export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: UserRole[];
  provider: AuthProvider;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}