import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeatureFlagController } from "./feature-flag.controller";
import { FeatureFlagService } from "./feature-flag.service";
import { FeatureFlagGateway } from "./feature-flag.gateway";
import { FeatureFlag, FeatureFlagSchema } from "./schemas/feature-flag.schema";
import { Project, ProjectSchema } from "../projects/schemas/project.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGateway],
  exports: [FeatureFlagService],
})
export class FeatureFlagModule {}
