import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ConfigModule } from "@nestjs/config"; // For Resend API key

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [MongooseModule, UsersService], // Export both model and service
})
export class UsersModule {}
