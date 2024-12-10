import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ApiKeysService } from "./api-keys.service";
import { ApiKey } from "./schemas/api-key.schema";

describe("ApiKeysService", () => {
  let service: ApiKeysService;
  let apiKeyModel: Model<ApiKey>;

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
    // Create a constructable function for the model
    const MockApiKeyModel = function (this: any, data: any) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue({ ...mockApiKey, ...data });
    } as any;

    // Add the static methods to the constructor function
    MockApiKeyModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([mockApiKey]),
    });
    MockApiKeyModel.findOneAndUpdate = jest.fn().mockResolvedValue(mockApiKey);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getModelToken(ApiKey.name),
          useValue: MockApiKeyModel,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    apiKeyModel = module.get<Model<ApiKey>>(getModelToken(ApiKey.name));
  });

  describe("create", () => {
    it("should create a new API key", async () => {
      const createDto = {
        name: "Test Key",
        projectId: mockProjectId.toString(),
      };

      const result = await service.create(createDto, mockOrgId.toString());

      expect(result.name).toBe(createDto.name);
      expect(result.key).toMatch(/^fp_live_/);
    });
  });

  describe("findAll", () => {
    it("should return all API keys for an organization", async () => {
      const populateSpy = jest.fn().mockResolvedValue([mockApiKey]);
      jest.spyOn(apiKeyModel, "find").mockReturnValue({
        populate: populateSpy,
      } as any);

      const result = await service.findAll(mockOrgId.toString());
      expect(result).toEqual([mockApiKey]);
    });
  });

  describe("deactivate", () => {
    it("should deactivate an API key", async () => {
      const deactivatedKey = { ...mockApiKey, isActive: false };
      jest
        .spyOn(apiKeyModel, "findOneAndUpdate")
        .mockResolvedValue(deactivatedKey);

      const result = await service.deactivate(
        mockApiKey._id.toString(),
        mockOrgId.toString()
      );
      expect(result?.isActive).toBe(false);
    });
  });

  describe("updateLastUsed", () => {
    it("should update lastUsed timestamp", async () => {
      const newDate = new Date();
      const updatedKey = { ...mockApiKey, lastUsed: newDate };

      jest.spyOn(apiKeyModel, "findOneAndUpdate").mockResolvedValue(updatedKey);

      const result = await service.updateLastUsed(mockApiKey.key);
      expect(result?.lastUsed).toEqual(newDate);
    });
  });
});
