import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Organization } from "../../organizations/schemas/organization.schema";
import { Project } from "../../projects/schemas/project.schema";

@Schema({ timestamps: true })
export class ApiKey extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Organization",
    required: true,
  })
  organization: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Project",
    required: true,
  })
  project: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastUsed?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
