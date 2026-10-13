import { Controller, Get, Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { AuditInterceptor } from "./common/audit.interceptor";
import { CmsModule } from "./cms/cms.module";
import { PrismaModule, PrismaService } from "./prisma.service";

@Controller("health")
class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async check(): Promise<{ status: string; db: boolean }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", db: true };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]), // 100 req/min par IP
    JwtModule.register({ global: true, secret: process.env.JWT_ACCESS_SECRET, signOptions: { expiresIn: "15m" } }),
    PrismaModule, AuthModule, CmsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
