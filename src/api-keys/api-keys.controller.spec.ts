import { Test, TestingModule } from "@nestjs/testing";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { Types } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "src/users/schemas/user.schema";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { OrganizationAuthGuard } from "src/common/guards/organization-auth.guard";

describe("ApiKeysController", () => {
  let controller: ApiKeysController;
  let service: ApiKeysService;

  const mockOrgId = new Types.ObjectId();
  const mockProjectId = new Types.ObjectId();

  const mockApiKey = {
    _id: new Types.ObjectId(),
    key: "fp_live_test123",
    name: "Test API Key",
    organization: mockOrgId,
    project: mockProjectId,
    isActive: true,
    lastUsed: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockApiKey),
            findAll: jest.fn().mockResolvedValue([mockApiKey]),
            deactivate: jest
              .fn()
              .mockResolvedValue({ ...mockApiKey, isActive: false }),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrganizationAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new API key", async () => {
      const createDto = {
        name: "Test Key",
        projectId: mockProjectId.toString(),
      };

      const result = await controller.create(createDto, mockOrgId.toString());

      expect(result).toEqual(mockApiKey);
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        mockOrgId.toString()
      );
    });
  });

  describe("findAll", () => {
    it("should return all API keys", async () => {
      const result = await controller.findAll(mockOrgId.toString());

      expect(result).toEqual([mockApiKey]);
      expect(service.findAll).toHaveBeenCalledWith(mockOrgId.toString());
    });
  });

  describe("deactivate", () => {
    it("should deactivate an API key", async () => {
      const result = await controller.deactivate(
        mockApiKey._id.toString(),
        mockOrgId.toString()
      );

      expect(result?.isActive).toBe(false);
      expect(service.deactivate).toHaveBeenCalledWith(
        mockApiKey._id.toString(),
        mockOrgId.toString()
      );
    });
  });
});
