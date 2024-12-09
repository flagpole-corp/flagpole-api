import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeatureFlagController } from "./feature-flag.controller";
import { FeatureFlagService } from "./feature-flag.service";
import { FeatureFlagGateway } from "./feature-flag.gateway";
import { FeatureFlag, FeatureFlagSchema } from "./schemas/feature-flag.schema";
import { Project, ProjectSchema } from "../projects/schemas/project.schema";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { WsJwtGuard } from "src/auth/guards/ws-jwt.guard";
import { AuthModule } from "src/auth/auth.module";
import { ApiKeysModule } from "src/api-keys/api-keys.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    AuthModule,
    ApiKeysModule,
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGateway, WsJwtGuard],
  exports: [FeatureFlagService],
})
export class FeatureFlagModule {}
