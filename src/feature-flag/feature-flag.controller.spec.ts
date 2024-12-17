import { Test, TestingModule } from "@nestjs/testing";
import { FeatureFlagController } from "./feature-flag.controller";
import { FeatureFlagService } from "./feature-flag.service";
import { UnauthorizedException } from "@nestjs/common";
import { Types } from "mongoose";
import type { CreateFeatureFlagDto } from "./dto/feature-flag.dto";
import type { FeatureFlag } from "./schemas/feature-flag.schema";
import type { RequestWithUser } from "../common/types/request";
import { ProjectContextGuard } from "src/common/guards/project-context.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { getModelToken } from "@nestjs/mongoose";
import { Project } from "../projects/schemas/project.schema";
import { ApiKey } from "../api-keys/schemas/api-key.schema";
import { ApiKeyGuard } from "../api-keys/guards/api-key.guard";
import {
  OrganizationRole,
  ProjectRole,
  ProjectStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "src/common/enums";
import { Organization } from "src/organizations/schemas/organization.schema";

const createMockRequest = (
  currentOrganization: Types.ObjectId | string | undefined = undefined
): Partial<RequestWithUser> => ({
  user: {
    _id: new Types.ObjectId(),
    email: "test@example.com",
    organizations: [],
    currentOrganization,
  },
  get: jest.fn(),
  header: jest.fn(),
  accepts: jest.fn(),
  acceptsCharsets: jest.fn(),
  acceptsEncodings: jest.fn(),
  acceptsLanguages: jest.fn(),
  range: jest.fn(),
});

describe("FeatureFlagController", () => {
  const mockUserId = new Types.ObjectId();
  const mockOrgId = new Types.ObjectId();
  const mockProjectId = new Types.ObjectId();

  const mockRequest = createMockRequest(mockOrgId) as RequestWithUser;
  const reqWithoutOrg = createMockRequest(undefined) as RequestWithUser;
  let controller: FeatureFlagController;
  let service: FeatureFlagService;

  const mockFeatureFlag: FeatureFlag = {
    _id: new Types.ObjectId(),
    name: "test-flag",
    description: "test description",
    isEnabled: false,
    project: mockProjectId,
    organization: mockOrgId,
    conditions: {},
    environments: ["development"],
    isArchived: false,
  } as FeatureFlag;

  const mockOrganization = {
    _id: mockOrgId,
    name: "Test Organization",
    slug: "test-organization",
    members: [
      {
        user: mockUserId,
        role: OrganizationRole.OWNER,
        joinedAt: new Date(),
        permissions: ["manage_members"],
      },
    ],
    settings: {
      defaultEnvironments: ["development", "staging", "production"],
      allowedDomains: [],
      notificationEmails: [],
    },
    subscription: {
      status: SubscriptionStatus.ACTIVE,
      plan: SubscriptionPlan.TRIAL,
      startDate: new Date(),
      maxProjects: 5,
      maxMembers: 5,
    },
  };

  const mockProject = {
    _id: mockProjectId,
    name: "Test Project",
    description: "Test Project Description",
    organization: mockOrgId,
    status: ProjectStatus.ACTIVE,
    members: [
      {
        user: mockUserId,
        role: ProjectRole.MEMBER,
        addedAt: new Date(),
      },
    ],
  };

  const mockApiKey: Partial<ApiKey> = {
    _id: new Types.ObjectId(),
    key: "fp_live_test123",
    name: "Test API Key",
    organization: mockOrgId,
    project: mockProjectId,
    isActive: true,
    lastUsed: new Date(),
  };

  const mockFlags = [mockFeatureFlag];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagController],
      providers: [
        {
          provide: FeatureFlagService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockFeatureFlag),
            findAll: jest.fn().mockResolvedValue(mockFlags),
            toggle: jest.fn().mockResolvedValue(mockFeatureFlag),
            update: jest.fn().mockResolvedValue(mockFeatureFlag),
            archive: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getModelToken(Project.name),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProject),
            exec: jest.fn().mockResolvedValue(mockProject),
          },
        },
        {
          provide: getModelToken(ApiKey.name),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockApiKey),
            findOneAndUpdate: jest.fn().mockResolvedValue(mockApiKey),
            exec: jest.fn().mockResolvedValue(mockApiKey),
          },
        },
        {
          provide: ProjectContextGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: ApiKeyGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    controller = module.get<FeatureFlagController>(FeatureFlagController);
    service = module.get<FeatureFlagService>(FeatureFlagService);
  });

  describe("create", () => {
    const createDto: CreateFeatureFlagDto = {
      name: "test-flag",
      description: "test description",
      environments: ["development"],
    };

    it("should create a feature flag", async () => {
      const result = await controller.create(
        mockProjectId.toString(),
        mockOrgId.toString(),
        createDto,
        mockRequest
      );

      expect(result).toBe(mockFeatureFlag);
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        mockProjectId.toString(),
        mockOrgId.toString()
      );
    });

    it("should throw UnauthorizedException when projectId is missing", async () => {
      await expect(
        controller.create("", mockOrgId.toString(), createDto, mockRequest)
      ).rejects.toThrow(UnauthorizedException);
      expect(service.create).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when organizationId is missing", async () => {
      await expect(
        controller.create(
          mockProjectId.toString(),
          "",
          createDto,
          reqWithoutOrg
        )
      ).rejects.toThrow(UnauthorizedException);
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all flags", async () => {
      const result = await controller.findAll(
        mockProjectId.toString(),
        mockRequest
      );

      expect(result).toBe(mockFlags);
      expect(service.findAll).toHaveBeenCalledWith(
        mockProjectId.toString(),
        mockOrgId.toString()
      );
    });

    it("should throw UnauthorizedException when projectId is missing", async () => {
      await expect(controller.findAll("", mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when organization context is missing", async () => {
      await expect(
        controller.findAll(mockProjectId.toString(), reqWithoutOrg)
      ).rejects.toThrow(UnauthorizedException);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    it("should toggle flag status", async () => {
      const result = await controller.toggle(
        mockProjectId.toString(),
        mockFeatureFlag._id.toString(),
        mockRequest
      );

      expect(result).toBe(mockFeatureFlag);
      expect(service.toggle).toHaveBeenCalledWith(
        mockFeatureFlag._id.toString(),
        mockProjectId.toString(),
        mockOrgId.toString()
      );
    });

    it("should throw UnauthorizedException when projectId is missing", async () => {
      await expect(
        controller.toggle("", mockFeatureFlag._id.toString(), mockRequest)
      ).rejects.toThrow(UnauthorizedException);
      expect(service.toggle).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateDto: Partial<CreateFeatureFlagDto> = {
      description: "updated description",
      environments: ["development", "staging"],
    };

    it("should update a feature flag", async () => {
      const result = await controller.update(
        mockFeatureFlag._id.toString(),
        mockProjectId.toString(),
        mockOrgId.toString(),
        updateDto,
        mockRequest
      );

      expect(result).toBe(mockFeatureFlag);
      expect(service.update).toHaveBeenCalledWith(
        mockFeatureFlag._id.toString(),
        updateDto,
        mockProjectId.toString(),
        mockOrgId.toString()
      );
    });

    it("should throw UnauthorizedException when projectId is missing", async () => {
      await expect(
        controller.update(
          mockFeatureFlag._id.toString(),
          "",
          mockOrgId.toString(),
          updateDto,
          mockRequest
        )
      ).rejects.toThrow(UnauthorizedException);
      expect(service.update).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when organizationId is missing", async () => {
      await expect(
        controller.update(
          mockFeatureFlag._id.toString(),
          mockProjectId.toString(),
          "",
          updateDto,
          mockRequest
        )
      ).rejects.toThrow(UnauthorizedException);
      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should archive a feature flag", async () => {
      await controller.delete(
        mockFeatureFlag._id.toString(),
        mockProjectId.toString(),
        mockOrgId.toString(),
        mockRequest
      );

      expect(service.archive).toHaveBeenCalledWith(
        mockFeatureFlag._id.toString(),
        mockProjectId.toString(),
        mockOrgId.toString()
      );
    });

    it("should throw UnauthorizedException when projectId is missing", async () => {
      await expect(
        controller.delete(
          mockFeatureFlag._id.toString(),
          "",
          mockOrgId.toString(),
          mockRequest
        )
      ).rejects.toThrow(UnauthorizedException);
      expect(service.archive).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when organizationId is missing", async () => {
      await expect(
        controller.delete(
          mockFeatureFlag._id.toString(),
          mockProjectId.toString(),
          "",
          mockRequest
        )
      ).rejects.toThrow(UnauthorizedException);
      expect(service.archive).not.toHaveBeenCalled();
    });
  });

  describe("findAllSdk", () => {
    it("should return all flags for SDK", async () => {
      const mockSdkRequest = {
        projectId: mockProjectId,
        organizationId: mockOrgId,
      };

      const result = await controller.findAllSdk(mockSdkRequest as any);

      expect(result).toBe(mockFlags);
      expect(service.findAll).toHaveBeenCalledWith(
        mockProjectId.toString(),
        mockOrgId.toString()
      );
    });
  });
});
