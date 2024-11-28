import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../../users/schemas/user.schema";
import { OrganizationContextMiddleware } from "./organization-context.middleware";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [OrganizationContextMiddleware],
  exports: [OrganizationContextMiddleware, MongooseModule],
})
export class MiddlewareModule {}
