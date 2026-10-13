import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/prisma-exception.filter";

async function bootstrap(): Promise<void> {
  for (const k of ["DATABASE_URL", "JWT_ACCESS_SECRET"]) {
    if (!process.env[k]) throw new Error(`Variable d'environnement manquante : ${k}`);
  }
  if ((process.env.JWT_ACCESS_SECRET ?? "").length < 32) throw new Error("JWT_ACCESS_SECRET doit faire au moins 32 caractères");
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1)); // derrière Nginx : vraie IP pour le rate limit et l'audit
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}
void bootstrap();
