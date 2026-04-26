import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";
import { verifyToken, type JwtPayload } from "./jwt.js";
import { enterRequestContext } from "../request-context.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function attachUser(req: FastifyRequest): Promise<void> {
  const cookieToken = (req.cookies as Record<string, string | undefined>)?.[env.COOKIE_NAME];
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;
  const token = headerToken ?? cookieToken;
  if (!token) return;
  const payload = verifyToken(token);
  if (payload) req.user = payload;
  const userId = payload?.kind === "user" ? payload.sub : null;
  enterRequestContext({ userId });
}

export function requireAuth(req: FastifyRequest, reply: FastifyReply, done: () => void): void {
  if (!req.user) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }
  done();
}

export function requireRole(role: "admin") {
  return (req: FastifyRequest, reply: FastifyReply, done: () => void): void => {
    if (!req.user || req.user.role !== role) {
      reply.code(403).send({ error: "forbidden" });
      return;
    }
    done();
  };
}
