import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PrismaService } from "../prisma.service";
import type { AuthedRequest } from "./types";

/** Trace chaque écriture (POST/PUT/PATCH/DELETE). Le corps n'est JAMAIS enregistré (mots de passe, données de santé). */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next.handle();
    const res = http.getResponse<{ statusCode: number }>();
    const log = (status: number): void => {
      const metadata: Prisma.InputJsonValue = { method: req.method, path: req.originalUrl.split("?")[0] ?? "", status };
      void this.prisma.auditLog
        .create({ data: { action: `${req.method} ${metadata.path}`, userId: req.user?.sub, infrastructureId: req.user?.infra ?? undefined, ip: req.ip ?? "?", metadata } })
        .catch(() => undefined);
    };
    return next.handle().pipe(tap({ next: () => log(res.statusCode), error: (e: unknown) => log(e instanceof HttpException ? e.getStatus() : 500) }));
  }
}
