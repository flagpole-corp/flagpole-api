import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    guard = new JwtAuthGuard();

    // Create a complete mock of ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {},
        }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
    };
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should extend AuthGuard with jwt strategy", () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  describe("canActivate", () => {
    it("should call parent AuthGuard canActivate", async () => {
      const mockCanActivate = jest.fn().mockResolvedValue(true);
      guard.canActivate = mockCanActivate;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });

    it("should pass through the authentication result from parent", async () => {
      const mockCanActivate = jest.fn().mockResolvedValue(false);
      guard.canActivate = mockCanActivate;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });

    it("should handle authentication errors properly", async () => {
      const mockCanActivate = jest
        .fn()
        .mockRejectedValue(new UnauthorizedException());
      guard.canActivate = mockCanActivate;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
