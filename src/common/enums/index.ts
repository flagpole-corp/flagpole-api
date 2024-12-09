export * from "./subscription.enum"; // Export everything from subscription.enum

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum OrganizationRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export enum ProjectStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted",
}

export enum ProjectRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer",
}
