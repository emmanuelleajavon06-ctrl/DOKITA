import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthedRequest, AuthUser } from "./types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) throw new UnauthorizedException();
    try {
      req.user = this.jwt.verify<AuthUser>(h.slice(7), { secret: process.env.JWT_ACCESS_SECRET });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
