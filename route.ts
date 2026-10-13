import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/lib/server";

export const dynamic = "force-dynamic";
const ALLOWED = new Set(["auth", "public", "admin", "health"]);
const FORWARD = ["content-type", "authorization", "cookie", "user-agent"];

/** Proxy même-origine vers l'API : le navigateur ne parle qu'à ce site (cookies de session fiables, pas de CORS). */
async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path } = await ctx.params;
  if (!path[0] || !ALLOWED.has(path[0])) return NextResponse.json({ message: "Introuvable" }, { status: 404 });
  const headers = new Headers();
  FORWARD.forEach((h) => { const v = req.headers.get(h); if (v) headers.set(h, v); });
  const ip = req.headers.get("x-forwarded-for");
  if (ip) headers.set("x-forwarded-for", ip);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let up: Response;
  try {
    up = await fetch(`${apiBase()}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`, {
      method: req.method, headers, body: hasBody ? await req.arrayBuffer() : undefined, redirect: "manual", cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Le service est momentanément indisponible. Réessayez dans un instant." }, { status: 502 });
  }
  const out = new NextResponse(up.body, { status: up.status });
  const ct = up.headers.get("content-type");
  if (ct) out.headers.set("content-type", ct);
  up.headers.getSetCookie().forEach((c) => out.headers.append("set-cookie", c));
  return out;
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
