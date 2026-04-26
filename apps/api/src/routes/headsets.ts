import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { signToken } from "../auth/jwt.js";
import { listConnectedHeadsetIds } from "../ws/server.js";

const createBody = z.object({
  deviceModel: z.string().min(1),
  serialNumber: z.string().min(1),
  operatorId: z.string().uuid().nullable().optional(),
});

export async function headsetRoutes(app: FastifyInstance): Promise<void> {
  app.get("/headsets", { preHandler: requireAuth }, async (_req, reply) => {
    const items = await prisma.headset.findMany({
      orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
      include: { operator: { select: { id: true, name: true, role: true } } },
    });
    const connected = new Set(listConnectedHeadsetIds());
    return reply.send({
      items: items.map((h) => ({
        ...h,
        link: h.link === "five_g" ? "5g" : h.link,
        connected: connected.has(h.id),
        lastSeenAt: h.lastSeenAt?.toISOString() ?? null,
      })),
    });
  });

  app.get("/headsets/online", { preHandler: requireAuth }, async (_req, reply) => {
    const ids = listConnectedHeadsetIds();
    if (!ids.length) return reply.send({ items: [] });
    const items = await prisma.headset.findMany({
      where: { id: { in: ids } },
      include: { operator: { select: { id: true, name: true } } },
    });
    return reply.send({
      items: items.map((h) => ({
        ...h,
        link: h.link === "five_g" ? "5g" : h.link,
        lastSeenAt: h.lastSeenAt?.toISOString() ?? null,
      })),
    });
  });

  app.post("/headsets", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const headset = await prisma.headset.create({ data: parsed.data });
    return reply.code(201).send({ headset });
  });

  // Issue a JWT a Unity headset (or simulator) can use to authenticate over WS.
  // Admin-only: dev-time provisioning helper.
  app.post("/headsets/:id/issue-token", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const headset = await prisma.headset.findUnique({ where: { id } });
    if (!headset) return reply.code(404).send({ error: "not_found" });
    const token = signToken({
      sub: headset.id,
      email: `headset+${headset.serialNumber}@portvision.local`,
      role: "viewer",
      kind: "headset",
    });
    return reply.send({ token });
  });
}
