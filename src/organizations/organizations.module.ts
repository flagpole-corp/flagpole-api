// src/organizations/organizations.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsService } from "./organizations.service";
import { OrganizationsController } from "./organizations.controller";
import {
  Organization,
  OrganizationSchema,
} from "./schemas/organization.schema";
import { UsersModule } from "src/users/users.module";
import { Project, ProjectSchema } from "src/projects/schemas/project.schema";
import {
  FeatureFlag,
  FeatureFlagSchema,
} from "src/feature-flag/schemas/feature-flag.schema";
import { SubscriptionService } from "./services/subscription.service";
import { SubscriptionLimitsGuard } from "../common/guards/subscription-limits.guard";

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
    ]),
  ],
  providers: [
    OrganizationsService,
    SubscriptionService,
    SubscriptionLimitsGuard,
  ],
  controllers: [OrganizationsController],
  exports: [
    OrganizationsService,
    SubscriptionService,
    SubscriptionLimitsGuard,
    MongooseModule,
  ],
})
export class OrganizationsModule {}
