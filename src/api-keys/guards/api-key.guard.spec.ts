import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ApiKeyGuard } from "./api-key.guard";
import { ApiKey } from "../schemas/api-key.schema";

describe("ApiKeyGuard", () => {
  let guard: ApiKeyGuard;
  let apiKeyModel: Model<ApiKey>;

  const mockOrgId = new Types.ObjectId();
  const mockProjectId = new Types.ObjectId();

  const mockApiKey = {
    _id: new Types.ObjectId(),
    key: "fp_live_test123",
    name: "Test API Key",
    organization: { _id: mockOrgId },
    project: { _id: mockProjectId },
    isActive: true,
    lastUsed: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          "x-api-key": mockApiKey.key,
        },
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: getModelToken(ApiKey.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue(mockApiKey),
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    apiKeyModel = module.get<Model<ApiKey>>(getModelToken(ApiKey.name));
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should allow access with valid API key", async () => {
      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(apiKeyModel.findOne).toHaveBeenCalledWith({
        key: mockApiKey.key,
        isActive: true,
      });
    });

    it("should throw UnauthorizedException when no API key provided", async () => {
      const contextWithoutKey = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      };

      await expect(
        guard.canActivate(contextWithoutKey as ExecutionContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for invalid API key", async () => {
      jest.spyOn(apiKeyModel, "findOne").mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        guard.canActivate(mockContext as ExecutionContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should update lastUsed timestamp", async () => {
      await guard.canActivate(mockContext as ExecutionContext);

      expect(mockApiKey.save).toHaveBeenCalled();
    });
  });
});
