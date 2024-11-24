import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Organization } from "../../organizations/schemas/organization.schema";
import { AuthProvider, OrganizationRole } from "../../common/enums";

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

  @Prop([
    {
      organization: { type: Types.ObjectId, ref: "Organization" },
      role: {
        type: String,
        enum: OrganizationRole,
        default: OrganizationRole.MEMBER,
      },
      joinedAt: { type: Date, default: Date.now },
    },
  ])
  organizations: Array<{
    organization: Types.ObjectId;
    role: OrganizationRole;
    joinedAt: Date;
  }>;

  @Prop({ type: Types.ObjectId, ref: "Organization" })
  currentOrganization?: Types.ObjectId;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ "organizations.organization": 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || undefined;
});
