import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { UserRole } from "../../common/enums/auth";

// Define the JWT payload interface
interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
}

// Extend the Socket type to include our custom properties
interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: AuthenticatedSocket = context.switchToWs().getClient();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        throw new WsException("Unauthorized");
      }

      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: process.env.JWT_SECRET,
        });

        // Attach the user payload to the socket instance
        client.user = payload;

        return true;
      } catch (error) {
        throw new WsException("Invalid token");
      }
    } catch (error) {
      throw new WsException(
        error instanceof WsException ? error.message : "Unauthorized"
      );
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;

    if (!authToken) {
      return undefined;
    }

    const [type, token] = authToken.split(" ");
    return type === "Bearer" ? token : undefined;
  }
}
