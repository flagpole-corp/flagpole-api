// src/projects/projects.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { Project, ProjectSchema } from "./schemas/project.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    OrganizationsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
