import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (e.code === "P2025") res.status(404).json({ statusCode: 404, message: "Élément introuvable" });
    else if (e.code === "P2002") res.status(409).json({ statusCode: 409, message: "Cet élément existe déjà" });
    else res.status(500).json({ statusCode: 500, message: "Erreur serveur" });
  }
}
