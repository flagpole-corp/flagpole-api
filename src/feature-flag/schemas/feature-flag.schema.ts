import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

@Schema({ timestamps: true, collection: "feature_flags" })
export class FeatureFlag extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: false })
  isEnabled: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: "Project",
    required: true,
    index: true,
  })
  project: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  })
  organization: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  conditions: Record<string, any>;

  @Prop({ type: [String], default: [] })
  environments: string[];

  @Prop()
  uniqueKey?: string;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);

// Create a compound unique index for name + organization
FeatureFlagSchema.index({ name: 1, organization: 1 }, { unique: true });
