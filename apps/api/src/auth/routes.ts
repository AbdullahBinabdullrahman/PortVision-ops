import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { signToken } from "./jwt.js";

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "invalid_credentials" });

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      kind: "user",
    });

    reply.setCookie(env.COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return reply.send({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  });

  app.post("/auth/logout", async (_req, reply) => {
    reply.clearCookie(env.COOKIE_NAME, { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", async (req, reply) => {
    if (!req.user || req.user.kind !== "user") {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) return reply.code(401).send({ error: "unauthorized" });
    return reply.send({ user });
  });
}
