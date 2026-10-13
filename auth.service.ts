import { ConflictException, HttpException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma.service";
import type { LoginDto, RegisterDto } from "./auth.dto";

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12); // temps constant si l'email n'existe pas
const REFRESH_DAYS = 7;

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: User["role"]; firstName: string; lastName: string };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<Session> {
    if (await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } })) {
      throw new ConflictException("Inscription impossible avec ces informations");
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email, passwordHash: await bcrypt.hash(dto.password, 12), role: "PATIENT",
        firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, patient: { create: {} },
      },
    });
    return this.issue(user);
  }

  async login(dto: LoginDto, ip: string): Promise<Session> {
    const since = new Date(Date.now() - 15 * 60_000);
    const [byEmail, byIp] = await Promise.all([
      this.prisma.loginAttempt.count({ where: { email: dto.email, success: false, createdAt: { gte: since } } }),
      this.prisma.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
    ]);
    if (byEmail >= 5 || byIp >= 30) throw new HttpException("Trop de tentatives. Réessayez dans 15 minutes.", 429);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    await this.prisma.loginAttempt.create({ data: { email: dto.email, ip, success: ok && !!user?.isActive } });
    if (!ok || !user || !user.isActive) throw new UnauthorizedException("Identifiants invalides");
    return this.issue(user);
  }

  /** Rotation : chaque refresh token n'est valable qu'une fois. Réutilisation d'un jeton révoqué = toute la famille est révoquée. */
  async refresh(raw: string | undefined): Promise<Session> {
    if (!raw) throw new UnauthorizedException();
    const t = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha(raw) }, include: { user: true } });
    if (!t) throw new UnauthorizedException();
    if (t.revokedAt || t.expiresAt < new Date()) {
      if (t.revokedAt) await this.prisma.refreshToken.updateMany({ where: { familyId: t.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException();
    }
    await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
    if (!t.user.isActive) throw new UnauthorizedException();
    return this.issue(t.user, t.familyId);
  }

  async logout(raw: string | undefined): Promise<void> {
    if (raw) await this.prisma.refreshToken.updateMany({ where: { tokenHash: sha(raw) }, data: { revokedAt: new Date() } });
  }

  me(id: string): Promise<Pick<User, "id" | "email" | "role" | "firstName" | "lastName" | "phone" | "infrastructureId"> | null> {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, infrastructureId: true } });
  }

  private async issue(user: User, familyId: string = randomUUID()): Promise<Session> {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshToken.create({
      data: { userId: user.id, familyId, tokenHash: sha(refreshToken), expiresAt: new Date(Date.now() + REFRESH_DAYS * 86_400_000) },
    });
    return {
      accessToken: this.jwt.sign({ sub: user.id, role: user.role, infra: user.infrastructureId }),
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    };
  }
}
