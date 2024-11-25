import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { RequestWithUser } from "../types/request";

@Injectable()
export class ProjectContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.projectId) {
      throw new ForbiddenException(
        "No project context found. Please select a project first."
      );
    }

    return true;
  }
}
