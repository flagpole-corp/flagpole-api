import { Request } from "express";
import { Types } from "mongoose";

export interface RequestUser {
  userId: string;
  email: string;
  currentOrganization: string;
  currentProject?: string;
}

export interface AuthenticatedUser {
  _id: Types.ObjectId | string;
  email: string;
  currentOrganization?: Types.ObjectId | string;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
  organizationId?: Types.ObjectId;
  projectId?: Types.ObjectId;
}
