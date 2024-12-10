import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { User } from "../../users/schemas/user.schema";
import { OrganizationRole } from "../../common/enums";
import {
  SubscriptionStatus,
  SubscriptionPlan,
  PLAN_LIMITS,
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

const OrganizationMemberSchema =
  SchemaFactory.createForClass(OrganizationMember);

@Schema({ timestamps: true })
class OrganizationSettings {
  @Prop({ type: [String], default: ["development", "staging", "production"] })
  defaultEnvironments: string[];

  @Prop({ type: [String], default: [] })
  allowedDomains: string[];

  @Prop({ type: [String], default: [] })
  notificationEmails: string[];
}

const OrganizationSettingsSchema =
  SchemaFactory.createForClass(OrganizationSettings);

@Schema({ timestamps: true })
class Subscription {
  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.TRIAL,
  })
  plan: SubscriptionPlan;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop()
  subscriptionEndsAt?: Date;

  @Prop({ default: () => PLAN_LIMITS[SubscriptionPlan.TRIAL].maxProjects })
  maxProjects: number;

  @Prop({ default: () => PLAN_LIMITS[SubscriptionPlan.TRIAL].maxUsers })
  maxMembers: number;
}

const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [OrganizationMemberSchema], default: [] })
  members: OrganizationMember[];

  @Prop({ type: OrganizationSettingsSchema, default: {} })
  settings: OrganizationSettings;

  @Prop({ type: SubscriptionSchema, required: true })
  subscription: Subscription;

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

  hasValidSubscription(): boolean {
    return (
      this.subscription.status === SubscriptionStatus.ACTIVE ||
      (this.subscription.status === SubscriptionStatus.TRIAL &&
        (!this.subscription.trialEndsAt ||
          this.subscription.trialEndsAt > new Date()))
    );
  }
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Add indexes
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ "members.user": 1 });
