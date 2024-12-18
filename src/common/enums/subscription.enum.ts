export enum SubscriptionPlan {
  IC = "IC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
  TRIAL = "TRIAL",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  INACTIVE = "inactive",
}

export interface PlanLimits {
  maxProjects: number;
  maxFlagsPerProject: number;
  maxUsers: number;
  trialDays?: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.IC]: {
    maxProjects: 1,
    maxFlagsPerProject: 10,
    maxUsers: 1,
  },
  [SubscriptionPlan.PRO]: {
    maxProjects: 50,
    maxFlagsPerProject: 1000,
    maxUsers: 20,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxProjects: Infinity,
    maxFlagsPerProject: Infinity,
    maxUsers: 200,
  },
  [SubscriptionPlan.TRIAL]: {
    maxProjects: 50,
    maxFlagsPerProject: 1000,
    maxUsers: 20,
    trialDays: 7,
  },
};
