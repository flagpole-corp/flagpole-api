import { Request } from "express";
import { Types } from "mongoose";

export interface RequestUser {
  _id: string | Types.ObjectId;
  email: string;
  currentOrganization?: string | Types.ObjectId;
  currentProject?: string;
  organizations: Array<{
    organization: Types.ObjectId;
    role: string;
    joinedAt: Date;
  }>;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  currentOrganization?: string;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
  organizationId?: Types.ObjectId;
  projectId?: Types.ObjectId;
}
