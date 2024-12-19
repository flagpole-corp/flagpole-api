import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { OrganizationRole, UserStatus } from "../../common/enums";
import { AuthProvider } from "src/common/enums/auth";

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ select: false })
  password?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({
    type: String,
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Prop()
  googleId?: string;

  @Prop()
  avatar?: string;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Prop()
  invitationToken?: string;

  @Prop()
  invitationTokenExpires?: Date;

  @Prop([
    {
      organization: { type: Types.ObjectId, ref: "Organization" },
      role: {
        type: String,
        enum: OrganizationRole,
        default: OrganizationRole.MEMBER,
      },
      joinedAt: { type: Date, default: Date.now },
      removedAt: { type: Date },
    },
  ])
  organizations: Array<{
    organization: Types.ObjectId;
    role: OrganizationRole;
    joinedAt: Date;
    removedAt?: Date;
  }>;

  @Prop({ type: Types.ObjectId, ref: "Organization" })
  currentOrganization?: Types.ObjectId;

  @Prop([
    {
      project: { type: Types.ObjectId, ref: "Project" },
      addedAt: { type: Date, default: Date.now },
    },
  ])
  projects: Array<{
    project: Types.ObjectId;
    addedAt: Date;
  }>;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ "organizations.organization": 1 });
UserSchema.index({ invitationToken: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || undefined;
});
