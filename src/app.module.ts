import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { FeatureFlagModule } from "./feature-flag/feature-flag.module";
import { AuthModule } from "./auth/auth.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { UsersModule } from "./users/users.module";
import { OrganizationContextMiddleware } from "./common/middleware/organization-context.middleware";
import { MiddlewareModule } from "./common/middleware/middleware.module";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>("MONGODB_URI");
        if (!uri) {
          throw new Error("MONGODB_URI is not defined");
        }
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    MiddlewareModule,
    AuthModule,
    OrganizationsModule,
    FeatureFlagModule,
    ProjectsModule,
  ],
})
export class AppModule {
  constructor(
    private organizationContextMiddleware: OrganizationContextMiddleware
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OrganizationContextMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
