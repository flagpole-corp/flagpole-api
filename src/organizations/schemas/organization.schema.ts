import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { SubscriptionStatus, OrganizationRole } from "../../common/enums";

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  slug: string; // URL-friendly name, e.g., "acme-corp"

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @Prop()
  subscriptionEndDate?: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop({ default: false })
  billingEnabled: boolean;

  @Prop({ type: Object })
  settings?: Record<string, any>;

  // Stripe or other payment provider customer ID
  @Prop()
  paymentCustomerId?: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
