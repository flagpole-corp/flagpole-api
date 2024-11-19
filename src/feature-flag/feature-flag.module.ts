import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeatureFlagController } from "./feature-flag.controller";
import { FeatureFlagService } from "./feature-flag.service";
import { FeatureFlagGateway } from "./feature-flag.gateway";
import { FeatureFlag, FeatureFlagSchema } from "./schemas/feature-flag.schema";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
    ]),
    AuthModule, // Import AuthModule to use JwtAuthGuard
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGateway],
})
export class FeatureFlagModule {}
