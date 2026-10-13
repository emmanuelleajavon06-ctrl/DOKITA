import type { Role } from "@prisma/client";
import type { Request } from "express";

export interface AuthUser { sub: string; role: Role; infra: string | null }
export interface AuthedRequest extends Request { user: AuthUser }
