import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthedRequest } from "./types";

/** Bloque les utilisateurs d'une structure SUSPENDED/CANCELED (sauf ADMIN_INFRA, pour qu'il puisse payer). */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const { user } = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!user.infra || user.role === "ADMIN_INFRA" || user.role === "SUPER_ADMIN") return true;
    const infra = await this.prisma.infrastructure.findUnique({ where: { id: user.infra }, select: { subscriptionStatus: true } });
    if (!infra || infra.subscriptionStatus === "SUSPENDED" || infra.subscriptionStatus === "CANCELED") {
      throw new ForbiddenException("L'abonnement de votre structure est suspendu. Contactez votre administrateur.");
    }
    return true;
  }
}
