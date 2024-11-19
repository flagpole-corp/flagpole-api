import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard";
import { FeatureFlagService } from "./feature-flag.service";

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
  server: Server;

  constructor(private featureFlagService: FeatureFlagService) {}

  async handleConnection(client: Socket) {
    const flags = await this.featureFlagService.findAll();
    client.emit("featureFlags", flags);
  }

  handleDisconnect(client: Socket) {
    console.log("Client disconnected:", client.id);
  }

  // Broadcast feature flag updates to all connected clients
  async broadcastFlagUpdate(flag: any) {
    this.server.emit("featureFlagUpdate", flag);
  }
}
