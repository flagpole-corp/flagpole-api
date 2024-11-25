import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { ProjectStatus, ProjectRole } from "../../common/enums";

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  })
  organization: Types.ObjectId;

  @Prop({
    type: String,
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
    index: true,
  })
  status: ProjectStatus;

  @Prop([
    {
      user: { type: Types.ObjectId, ref: "User" },
      role: {
        type: String,
        enum: ProjectRole,
        default: ProjectRole.MEMBER,
      },
      addedAt: { type: Date, default: Date.now },
    },
  ])
  members: Array<{
    user: Types.ObjectId;
    role: ProjectRole;
    addedAt: Date;
  }>;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ name: 1, organization: 1 }, { unique: true });
ProjectSchema.index({ "members.user": 1 });
