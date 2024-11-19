import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { Server } from "socket.io";
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard";
import { FeatureFlag } from "./schemas/feature-flag.schema";
import { AuthenticatedSocket } from "../types/socket";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
@UseGuards(WsJwtGuard)
export class FeatureFlagGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.user?.email}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.user?.email}`);
  }

  // Method to emit initial flags to a client
  async emitInitialFlags(flags: FeatureFlag[]) {
    this.server.emit("featureFlags", flags);
  }

  // Method to emit flag updates to all clients
  async emitFlagUpdate(flag: FeatureFlag) {
    this.server.emit("featureFlagUpdate", flag);
  }

  // Method to emit flag deletion to all clients
  async emitFlagDeletion(flagId: string) {
    this.server.emit("featureFlagDelete", flagId);
  }
}
