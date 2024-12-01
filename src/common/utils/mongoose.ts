import { Types } from "mongoose";

export const toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
};

export const isValidObjectId = (id: any): boolean => {
  return Types.ObjectId.isValid(id);
};
