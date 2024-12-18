import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "src/common/enums";

jest.mock("./guards/jwt-auth.guard", () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock("@nestjs/passport", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock user data
  const mockUser = {
    _id: "userId",
    id: "userId",
    email: "test@example.com",
    status: UserStatus.ACTIVE,
    organizations: [
      {
        organization: "orgId",
        role: "member",
        joinedAt: new Date(),
      },
    ],
    currentOrganization: "orgId",
    projects: [],
  };

  // Mock login response
  const mockLoginResponse = {
    access_token: "jwt-token",
    user: {
      id: "userId",
      email: "test@example.com",
      status: UserStatus.ACTIVE,
      currentOrganization: "orgId",
      organizations: [
        {
          organization: "orgId",
          role: "member",
          joinedAt: expect.any(String),
        },
      ],
    },
  };

  // Mock user profile
  const mockUserProfile = {
    id: "userId",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    status: UserStatus.ACTIVE,
    currentOrganization: "orgId",
    organizations: [
      {
        organization: "orgId",
        role: "member",
        joinedAt: expect.any(String),
      },
    ],
    projects: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockLoginResponse),
            getCurrentUser: jest.fn().mockResolvedValue(mockUserProfile),
            revokeToken: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should return login response with JWT token and user info", async () => {
      const req = {
        user: mockUser,
      };

      const result = await controller.login(req as any);

      expect(result).toEqual(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it("should throw UnauthorizedException when user is not in request", async () => {
      await expect(async () => {
        await controller.login({ user: undefined } as any);
      }).rejects.toThrow(UnauthorizedException);

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe("googleAuth", () => {
    it("should exist as a route handler", () => {
      expect(controller.googleAuth).toBeDefined();
    });
  });

  describe("googleAuthRedirect", () => {
    it("should handle Google OAuth callback and return login response", async () => {
      const req = {
        user: mockUser,
      };

      const result = await controller.googleAuthRedirect(req as any);

      expect(result).toEqual(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it("should throw UnauthorizedException when user is not in request", async () => {
      await expect(async () => {
        await controller.googleAuthRedirect({ user: undefined } as any);
      }).rejects.toThrow(UnauthorizedException);

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user profile", async () => {
      const req = {
        user: mockUser,
      };

      const result = await controller.getCurrentUser(req as any);

      expect(result).toEqual(mockUserProfile);
      expect(authService.getCurrentUser).toHaveBeenCalledWith(mockUser._id);
    });

    it("should throw UnauthorizedException when user is not in request", async () => {
      await expect(async () => {
        await controller.getCurrentUser({ user: undefined } as any);
      }).rejects.toThrow(UnauthorizedException);

      expect(authService.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should successfully logout user", async () => {
      const req = {
        user: mockUser,
      };

      await controller.logout(req as any);

      expect(authService.revokeToken).toHaveBeenCalledWith(mockUser.id);
    });

    it("should throw UnauthorizedException when user is not in request", async () => {
      await expect(async () => {
        await controller.logout({ user: undefined } as any);
      }).rejects.toThrow(UnauthorizedException);

      expect(authService.revokeToken).not.toHaveBeenCalled();
    });
  });
});
