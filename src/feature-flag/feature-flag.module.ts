import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeatureFlagController } from "./feature-flag.controller";
import { FeatureFlagService } from "./feature-flag.service";
import { FeatureFlagGateway } from "./feature-flag.gateway";
import { FeatureFlag, FeatureFlagSchema } from "./schemas/feature-flag.schema";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGateway],
})
export class FeatureFlagModule {}
