import { Socket } from "socket.io";
import { UserRole } from "../common/enums/auth";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
}

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}
