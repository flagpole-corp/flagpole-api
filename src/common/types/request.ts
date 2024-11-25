import { Request } from "express";
import { Types } from "mongoose";

export interface RequestUser {
  userId: string;
  email: string;
  currentOrganization: string;
  currentProject?: string;
}
export interface RequestWithUser extends Request {
  user: RequestUser;
  organizationId?: Types.ObjectId;
  projectId?: Types.ObjectId;
}
