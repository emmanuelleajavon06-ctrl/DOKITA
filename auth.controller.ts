import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import type { AuthedRequest } from "../common/types";
import { LoginDto, RegisterDto } from "./auth.dto";
import { AuthService, Session } from "./auth.service";

const COOKIE = "sd_refresh";
const COOKIE_PATH = process.env.COOKIE_PATH ?? "/auth";
const setCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: COOKIE_PATH, maxAge: 7 * 86_400_000 });
};
const readCookie = (req: Request): string | undefined => (req.cookies as Record<string, string | undefined> | undefined)?.[COOKIE];
const body = (s: Session): Pick<Session, "accessToken" | "user"> => ({ accessToken: s.accessToken, user: s.user });

@Controller("auth")
@Throttle({ default: { limit: 10, ttl: 1000 } }) // 10 req/s sur l'authentification
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.register(dto);
    setCookie(res, s.refreshToken);
    return body(s);
  }

  @Post("login") @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.login(dto, req.ip ?? "?");
    setCookie(res, s.refreshToken);
    return body(s);
  }

  @Post("refresh") @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.refresh(readCookie(req));
    setCookie(res, s.refreshToken);
    return body(s);
  }

  @Post("logout") @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(readCookie(req));
    res.clearCookie(COOKIE, { path: COOKIE_PATH });
    return { ok: true };
  }

  @Get("me") @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.user.sub);
  }
}
