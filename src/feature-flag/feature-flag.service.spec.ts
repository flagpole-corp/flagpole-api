import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types, Document } from "mongoose";
import { FeatureFlagService } from "./feature-flag.service";
import { FeatureFlag } from "./schemas/feature-flag.schema";
import { Project } from "../projects/schemas/project.schema";
import { FeatureFlagGateway } from "./feature-flag.gateway";
import { NotFoundException } from "@nestjs/common";
import { FeatureFlagController } from "./feature-flag.controller";

describe("FeatureFlagService", () => {
  let service: FeatureFlagService;
  let featureFlagModel: Model<FeatureFlag>;
  let projectModel: Model<Project>;
  let gateway: FeatureFlagGateway;

  const mockOrgId = new Types.ObjectId();
  const mockProjectId = new Types.ObjectId();

  // Define a proper type for our mock flag
  type MockFeatureFlag = Document<unknown, {}, FeatureFlag> &
    FeatureFlag & { _id: Types.ObjectId };

  const createMockFeatureFlag = (
    data: Partial<FeatureFlag> = {}
  ): MockFeatureFlag =>
    ({
      _id: new Types.ObjectId(),
      name: "test-flag",
      description: "test description",
      isEnabled: false,
      project: mockProjectId,
      organization: mockOrgId,
      conditions: {},
      environments: ["development"],
      save: jest.fn().mockResolvedValue(this),
      ...data,
    } as MockFeatureFlag);

  const mockFeatureFlag = createMockFeatureFlag();
  const mockFlags = [mockFeatureFlag];

  const mockProject = {
    _id: mockProjectId,
    organization: mockOrgId,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: getModelToken(FeatureFlag.name),
          useValue: {
            find: jest.fn().mockResolvedValue(mockFlags),
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockFeatureFlag),
            }),
            findOneAndUpdate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockFeatureFlag),
            }),
            countDocuments: jest.fn().mockResolvedValue(0),
            create: jest
              .fn()
              .mockImplementation((dto) =>
                Promise.resolve([createMockFeatureFlag(dto)])
              ),
          },
        },
        {
          provide: getModelToken(Project.name),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProject),
          },
        },
        {
          provide: FeatureFlagGateway,
          useValue: {
            emitFlagUpdate: jest.fn(),
            emitFlagDeletion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
    featureFlagModel = module.get<Model<FeatureFlag>>(
      getModelToken(FeatureFlag.name)
    );
    projectModel = module.get<Model<Project>>(getModelToken(Project.name));
    gateway = module.get<FeatureFlagGateway>(FeatureFlagGateway);
  });

  describe("findAll", () => {
    it("should return all non-archived feature flags for a project", async () => {
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();

      jest.spyOn(featureFlagModel, "find").mockResolvedValue(mockFlags);

      const result = await service.findAll(projectId, organizationId);

      expect(result).toEqual(mockFlags);
      expect(featureFlagModel.find).toHaveBeenCalledWith({
        project: new Types.ObjectId(projectId),
        $or: [
          { isArchived: { $ne: true } },
          { isArchived: { $exists: false } },
        ],
      });
    });
  });

  describe("create", () => {
    it("should create a new feature flag", async () => {
      const createDto = {
        name: "new-flag",
        description: "new flag description",
        isEnabled: false,
        environments: ["development"],
      };
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();

      const newFlag = createMockFeatureFlag({
        ...createDto,
        project: new Types.ObjectId(projectId),
        organization: mockOrgId,
      });

      jest.spyOn(featureFlagModel, "create").mockResolvedValue([newFlag]);

      const result = await service.create(createDto, projectId, organizationId);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(gateway.emitFlagUpdate).toHaveBeenCalled();
    });
  });
  describe("update", () => {
    it("should update a feature flag", async () => {
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();
      const flagId = new Types.ObjectId().toString();
      const updateDto = {
        description: "updated description",
        environments: ["development", "staging"],
      };

      const updatedFlag = createMockFeatureFlag({
        ...mockFeatureFlag,
        ...updateDto,
      });

      jest.spyOn(featureFlagModel, "findOneAndUpdate").mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedFlag),
      } as any);

      const result = await service.update(
        flagId,
        updateDto,
        projectId,
        organizationId
      );

      expect(result).toEqual(updatedFlag);
      expect(featureFlagModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(flagId),
          project: new Types.ObjectId(projectId),
          $or: [
            { isArchived: { $ne: true } },
            { isArchived: { $exists: false } },
          ],
        },
        { $set: updateDto },
        { new: true }
      );
      expect(gateway.emitFlagUpdate).toHaveBeenCalledWith(updatedFlag);
    });

    it("should throw NotFoundException when flag not found", async () => {
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();
      const flagId = new Types.ObjectId().toString();
      const updateDto = { description: "updated" };

      jest.spyOn(featureFlagModel, "findOneAndUpdate").mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update(flagId, updateDto, projectId, organizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("archive", () => {
    it("should archive a feature flag", async () => {
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();
      const flagId = new Types.ObjectId().toString();

      const archivedFlag = createMockFeatureFlag({
        ...mockFeatureFlag,
        isArchived: true,
      });

      jest.spyOn(projectModel, "findOne").mockResolvedValue(mockProject);
      jest.spyOn(featureFlagModel, "findOneAndUpdate").mockReturnValue({
        exec: jest.fn().mockResolvedValue(archivedFlag),
      } as any);

      await service.archive(flagId, projectId, organizationId);

      expect(featureFlagModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(flagId),
          project: new Types.ObjectId(projectId),
          isArchived: { $ne: true },
        },
        { $set: { isArchived: true } }
      );
      expect(gateway.emitFlagDeletion).toHaveBeenCalledWith(flagId);
    });

    it("should throw NotFoundException when flag not found for archiving", async () => {
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();
      const flagId = new Types.ObjectId().toString();

      jest.spyOn(projectModel, "findOne").mockResolvedValue(mockProject);
      jest.spyOn(featureFlagModel, "findOneAndUpdate").mockResolvedValue(null);

      await expect(
        service.archive(flagId, projectId, organizationId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when project not found", async () => {
      const projectId = mockProjectId.toString();
      const organizationId = mockOrgId.toString();
      const flagId = new Types.ObjectId().toString();

      jest.spyOn(projectModel, "findOne").mockResolvedValue(null);

      await expect(
        service.archive(flagId, projectId, organizationId)
      ).rejects.toThrow(NotFoundException);

      expect(featureFlagModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
