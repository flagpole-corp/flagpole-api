import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { User } from "../../users/schemas/user.schema";
import { OrganizationRole } from "../../common/enums";
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from "src/common/enums/subscription.enum";

@Schema({ timestamps: true })
class OrganizationMember {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  user: User;

  @Prop({
    type: String,
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  role: OrganizationRole;

  @Prop({ required: true })
  joinedAt: Date;

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

@Schema({ timestamps: true })
class OrganizationSettings {
  @Prop({ type: [String], default: ["development", "staging", "production"] })
  defaultEnvironments: string[];

  @Prop({ type: [String], default: [] })
  allowedDomains: string[];

  @Prop({ type: [String], default: [] })
  notificationEmails: string[];
}

@Schema({ timestamps: true })
class Subscription {
  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Prop({ required: true })
  plan: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop({ default: 10 })
  maxProjects: number;

  @Prop({ default: 20 })
  maxMembers: number;
}

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [OrganizationMember], default: [] })
  members: OrganizationMember[];

  @Prop({ type: OrganizationSettings, default: {} })
  settings: OrganizationSettings;

  @Prop({ type: Subscription, required: true })
  subscription: Subscription;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.TRIAL,
  })
  plan: SubscriptionPlan;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  subscriptionStatus: SubscriptionStatus;

  @Prop()
  trialEndsAt?: Date;

  @Prop()
  subscriptionEndsAt?: Date;

  // Methods
  hasUser(userId: string): boolean {
    return this.members.some((member) => member.user.toString() === userId);
  }

  getUserRole(userId: string): OrganizationRole | null {
    const member = this.members.find((m) => m.user.toString() === userId);
    return member ? member.role : null;
  }

  isOwner(userId: string): boolean {
    const member = this.members.find((m) => m.user.toString() === userId);
    return member?.role === OrganizationRole.OWNER;
  }

  canManageMembers(userId: string): boolean {
    const member = this.members.find((m) => m.user.toString() === userId);
    return member?.permissions.includes("manage_members") ?? false;
  }
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Add indexes
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ "members.user": 1 });
