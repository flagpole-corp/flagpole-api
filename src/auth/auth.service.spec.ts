import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuthService } from "./auth.service";
import { User, UserDocument } from "../users/schemas/user.schema";
import * as bcrypt from "bcrypt";
import { UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "src/common/enums";

const createMockMongooseModel = () => {
  const mockModel = function (dto: any) {
    return {
      ...dto,
      _id: expect.any(String),
      save: jest.fn().mockResolvedValue({ _id: "someId", ...dto }),
      toObject: jest.fn().mockReturnValue(dto),
    };
  } as any;

  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.updateOne = jest.fn();
  mockModel.select = jest.fn().mockReturnThis();
  mockModel.populate = jest.fn().mockReturnThis();
  mockModel.exec = jest.fn();

  return mockModel;
};

describe("AuthService", () => {
  let service: AuthService;
  let MockUserModel: ReturnType<typeof createMockMongooseModel>;
  let jwtService: JwtService;

  beforeEach(async () => {
    MockUserModel = createMockMongooseModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-jwt-token"),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should return null for non-existent user", async () => {
      MockUserModel.findOne.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(null),
      }));

      const result = await service.validateUser(
        "nonexistent@example.com",
        "password"
      );
      expect(result).toBeNull();
    });

    it("should return null for inactive user", async () => {
      const inactiveUser = {
        email: "test@example.com",
        password: "hashedPassword",
        status: UserStatus.PENDING,
        toObject: jest.fn().mockReturnValue({
          email: "test@example.com",
          password: "hashedPassword",
          status: UserStatus.PENDING,
        }),
      };

      MockUserModel.findOne.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(inactiveUser),
      }));

      const result = await service.validateUser("test@example.com", "password");
      expect(result).toBeNull();
    });

    it("should return null for user without password (Google auth)", async () => {
      const googleUser = {
        email: "test@example.com",
        googleId: "google123",
        toObject: jest.fn().mockReturnValue({ email: "test@example.com" }),
      };

      MockUserModel.findOne.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(googleUser),
      }));

      const result = await service.validateUser("test@example.com", "password");
      expect(result).toBeNull();
    });

    it("should return user object without password for valid credentials", async () => {
      const user = {
        email: "test@example.com",
        password: "hashedPassword",
        status: UserStatus.ACTIVE,
        toObject: jest.fn().mockReturnValue({
          email: "test@example.com",
          password: "hashedPassword",
          status: UserStatus.ACTIVE,
        }),
      };

      jest
        .spyOn(bcrypt, "compare")
        .mockImplementationOnce(() => Promise.resolve(true));
      MockUserModel.findOne.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(user),
      }));

      const result = await service.validateUser("test@example.com", "password");
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });
  });

  describe("login", () => {
    it("should generate JWT token and return user data", async () => {
      const mockUser = {
        _id: "userId",
        email: "test@example.com",
        status: "active",
        currentOrganization: "orgId",
        organizations: [{ organization: "orgId" }],
        save: jest.fn(),
      };

      const result = await service.login(mockUser as unknown as UserDocument);

      expect(result).toEqual({
        access_token: "mock-jwt-token",
        user: {
          id: "userId",
          email: "test@example.com",
          status: "active",
          currentOrganization: "orgId",
          organizations: [{ organization: "orgId" }],
        },
      });
    });

    it("should set currentOrganization if not set but organizations exist", async () => {
      const mockUser = {
        _id: "userId",
        email: "test@example.com",
        status: "active",
        currentOrganization: undefined,
        organizations: [{ organization: "orgId" }],
        save: jest.fn(),
      };

      await service.login(mockUser as unknown as UserDocument);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when user is not active", async () => {
      const mockUser = {
        _id: "userId",
        email: "test@example.com",
        status: "invited",
        currentOrganization: "orgId",
        organizations: [{ organization: "orgId" }],
        save: jest.fn(),
      };

      await expect(
        service.login(mockUser as unknown as UserDocument)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("validateGoogleUser", () => {
    it("should not update invited user", async () => {
      const invitedUser = {
        email: "test@example.com",
        status: UserStatus.PENDING,
      };

      MockUserModel.findOne.mockResolvedValueOnce(invitedUser);

      await expect(
        service.validateGoogleUser({
          email: "test@example.com",
          googleId: "google123",
        })
      ).rejects.toThrow();
    });

    it("should update existing user with googleId if not present", async () => {
      const existingUser = {
        email: "test@example.com",
        googleId: undefined,
        save: jest.fn().mockResolvedValue({
          email: "test@example.com",
          googleId: "google123",
        }),
      };

      MockUserModel.findOne.mockResolvedValueOnce(existingUser);

      const result = await service.validateGoogleUser({
        email: "test@example.com",
        googleId: "google123",
      });

      expect(existingUser.save).toHaveBeenCalled();
      expect(result.googleId).toBe("google123");
    });

    it("should create new active user if not exists", async () => {
      MockUserModel.findOne.mockResolvedValueOnce(null);

      const result = await service.validateGoogleUser({
        email: "new@example.com",
        googleId: "google123",
      });

      expect(result).toBeDefined();
      expect(result.email).toBe("new@example.com");
      expect(result.googleId).toBe("google123");
      expect(result.provider).toBe("google");
      expect(result.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe("getCurrentUser", () => {
    it("should return formatted user data", async () => {
      const mockUser = {
        _id: "userId",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        currentOrganization: "orgId",
        organizations: [
          {
            organization: {
              toString: () => "orgId",
            },
          },
        ],
      };

      MockUserModel.findById.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      }));

      const result = await service.getCurrentUser("userId");

      expect(result).toEqual({
        id: "userId",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        currentOrganization: "orgId",
        organizations: [{ organization: "orgId" }],
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      MockUserModel.findById.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(null),
      }));

      await expect(service.getCurrentUser("userId")).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("revokeToken", () => {
    it("should update user with logout information", async () => {
      await service.revokeToken("userId");

      expect(MockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: "userId" },
        {
          $set: {
            loggedOut: true,
            lastLogoutAt: expect.any(Date),
            refreshToken: null,
          },
          $push: {
            securityEvents: {
              type: "logout",
              timestamp: expect.any(Date),
            },
          },
        }
      );
    });
  });
});
