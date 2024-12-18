import { ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { WsJwtGuard } from "./ws-jwt.guard";
import { UserRole } from "../../common/enums/auth";

describe("WsJwtGuard", () => {
  let guard: WsJwtGuard;
  let jwtService: JwtService;

  const mockJwtPayload = {
    sub: "user123",
    email: "test@example.com",
    roles: [UserRole.USER],
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(() => {
    jwtService = mockJwtService as any;
    guard = new WsJwtGuard(jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a properly typed mock socket
  const createMockSocket = (authToken?: string): Partial<Socket> => {
    return {
      handshake: {
        auth: authToken ? { token: authToken } : {},
        query: {},
        headers: {},
        time: new Date().toString(),
        address: "",
        xdomain: false,
        secure: false,
        issued: new Date().getTime(),
        url: "",
      },
      nsp: {
        name: "/test",
      } as any,
      client: {
        conn: {
          transport: {
            name: "websocket",
          },
        },
      } as any,
      rooms: new Set(),
      data: {},
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    };
  };

  // Helper function to create mock execution context
  const createMockExecutionContext = (authToken?: string): ExecutionContext => {
    const mockSocket = createMockSocket(authToken);

    return {
      switchToWs: () => ({
        getClient: () => mockSocket,
      }),
    } as ExecutionContext;
  };

  describe("canActivate", () => {
    it("should return true for valid token", async () => {
      const validToken = "Bearer valid.jwt.token";
      mockJwtService.verifyAsync.mockResolvedValueOnce(mockJwtPayload);

      const context = createMockExecutionContext(validToken);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        "valid.jwt.token",
        { secret: process.env.JWT_SECRET }
      );

      const socket = context.switchToWs().getClient();
      expect(socket.user).toEqual(mockJwtPayload);
    });

    it("should throw WsException for missing token", async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException("Unauthorized")
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("should throw WsException for invalid token format", async () => {
      const invalidToken = "invalid-token-format";
      const context = createMockExecutionContext(invalidToken);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException("Unauthorized")
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("should throw WsException for incorrect bearer format", async () => {
      const incorrectBearer = "NotBearer token.here";
      const context = createMockExecutionContext(incorrectBearer);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException("Unauthorized")
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("should throw WsException for invalid JWT", async () => {
      const invalidJwt = "Bearer invalid.jwt.token";
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error("Invalid token")
      );

      const context = createMockExecutionContext(invalidJwt);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException("Invalid token")
      );
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from valid bearer header", () => {
      const mockSocket = createMockSocket("Bearer valid.token.here");
      const token = guard["extractTokenFromHeader"](mockSocket as Socket);
      expect(token).toBe("valid.token.here");
    });

    it("should return undefined for missing auth token", () => {
      const mockSocket = createMockSocket();
      const token = guard["extractTokenFromHeader"](mockSocket as Socket);
      expect(token).toBeUndefined();
    });

    it("should return undefined for non-bearer token", () => {
      const mockSocket = createMockSocket("Basic some.token.here");
      const token = guard["extractTokenFromHeader"](mockSocket as Socket);
      expect(token).toBeUndefined();
    });

    it("should return undefined for malformed bearer token", () => {
      const mockSocket = createMockSocket("Bearer");
      const token = guard["extractTokenFromHeader"](mockSocket as Socket);
      expect(token).toBeUndefined();
    });
  });
});
