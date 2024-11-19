import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class FeatureFlag extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: false })
  isEnabled: boolean;

  @Prop({ type: Object, default: {} })
  conditions: Record<string, any>;

  @Prop({ type: [String], default: [] })
  environments: string[];
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
