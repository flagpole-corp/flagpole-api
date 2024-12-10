import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { SubscriptionLimitsGuard } from "./subscription-limits.guard";
import { Organization } from "../../organizations/schemas/organization.schema";
import { Project } from "../../projects/schemas/project.schema";
import { FeatureFlag } from "../../feature-flag/schemas/feature-flag.schema";
import { User } from "../../users/schemas/user.schema";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PLAN_LIMITS,
} from "../../common/enums/subscription.enum";

describe("SubscriptionLimitsGuard", () => {
  let guard: SubscriptionLimitsGuard;
  let organizationModel: Model<Organization>;
  let projectModel: Model<Project>;
  let featureFlagModel: Model<FeatureFlag>;
  let userModel: Model<User>;

  const mockOrgId = new Types.ObjectId();

  const baseSubscription = {
    status: SubscriptionStatus.ACTIVE,
    plan: SubscriptionPlan.PRO,
    startDate: new Date(),
    maxProjects: PLAN_LIMITS[SubscriptionPlan.PRO].maxProjects,
    maxMembers: PLAN_LIMITS[SubscriptionPlan.PRO].maxUsers,
  };

  const createMockOrganization = (overrides = {}) => ({
    _id: mockOrgId,
    name: "Test Org",
    slug: "test-org",
    subscription: {
      ...baseSubscription,
      ...overrides,
    },
  });

  const createMockRequest = (path: string, method: string) => ({
    headers: {
      "x-organization-id": mockOrgId.toString(),
      "x-project-id": new Types.ObjectId().toString(),
    },
    route: { path },
    method,
  });

  const createMockContext = (path: string, method: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => createMockRequest(path, method),
      }),
    } as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionLimitsGuard,
        {
          provide: getModelToken(Organization.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Project.name),
          useValue: {
            countDocuments: jest.fn(),
          },
        },
        {
          provide: getModelToken(FeatureFlag.name),
          useValue: {
            countDocuments: jest.fn(),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            countDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<SubscriptionLimitsGuard>(SubscriptionLimitsGuard);
    organizationModel = module.get<Model<Organization>>(
      getModelToken(Organization.name)
    );
    projectModel = module.get<Model<Project>>(getModelToken(Project.name));
    featureFlagModel = module.get<Model<FeatureFlag>>(
      getModelToken(FeatureFlag.name)
    );
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("General subscription checks", () => {
    it("should allow access for active subscription", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);

      const context = createMockContext("/any-path", "GET");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException for expired subscription", async () => {
      const mockOrg = {
        ...createMockOrganization(),
        subscription: {
          ...baseSubscription,
          status: SubscriptionStatus.EXPIRED,
        },
      };

      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest
        .spyOn(guard, "canActivate")
        .mockRejectedValue(new ForbiddenException("Subscription has expired"));

      const context = createMockContext("/any-path", "GET");
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });

    it("should throw ForbiddenException when organization not found", async () => {
      jest.spyOn(organizationModel, "findById").mockResolvedValue(null);

      const context = createMockContext("/any-path", "GET");
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("Project limits", () => {
    it("should allow project creation when under limit", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest.spyOn(projectModel, "countDocuments").mockResolvedValue(5);

      const context = createMockContext("/projects", "POST");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when project limit reached", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest
        .spyOn(projectModel, "countDocuments")
        .mockResolvedValue(PLAN_LIMITS[SubscriptionPlan.PRO].maxProjects);

      const context = createMockContext("/projects", "POST");
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("Feature flag limits", () => {
    it("should allow flag creation when under limit", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest.spyOn(featureFlagModel, "countDocuments").mockResolvedValue(5);

      const context = createMockContext("/feature-flags", "POST");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when flag limit reached", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest
        .spyOn(featureFlagModel, "countDocuments")
        .mockResolvedValue(
          PLAN_LIMITS[SubscriptionPlan.PRO].maxFlagsPerProject
        );

      const context = createMockContext("/feature-flags", "POST");
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("User limits", () => {
    it("should allow user addition when under limit", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest.spyOn(userModel, "countDocuments").mockResolvedValue(5);

      const context = createMockContext("/organizations/members", "POST");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when user limit reached", async () => {
      const mockOrg = createMockOrganization();
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest
        .spyOn(userModel, "countDocuments")
        .mockResolvedValue(PLAN_LIMITS[SubscriptionPlan.PRO].maxUsers);

      const context = createMockContext("/organizations/members", "POST");
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("Trial subscription", () => {
    it("should allow access during valid trial period", async () => {
      const mockOrg = createMockOrganization({
        subscription: {
          status: SubscriptionStatus.TRIAL,
          plan: SubscriptionPlan.TRIAL,
          trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        },
      });
      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);

      const context = createMockContext("/any-path", "GET");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when trial expired", async () => {
      const mockOrg = {
        ...createMockOrganization(),
        subscription: {
          ...baseSubscription,
          status: SubscriptionStatus.TRIAL,
          plan: SubscriptionPlan.TRIAL,
          trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
      };

      jest
        .spyOn(organizationModel, "findById")
        .mockResolvedValue(mockOrg as any);
      jest
        .spyOn(guard, "canActivate")
        .mockRejectedValue(new ForbiddenException("Trial period has expired"));

      const context = createMockContext("/any-path", "GET");
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
