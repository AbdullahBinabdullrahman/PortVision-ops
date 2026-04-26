import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { broadcastToDashboards } from "../ws/server.js";

const listQuery = z.object({
  acknowledged: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  severity: z.enum(["info", "warn", "critical"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.get("/alerts", { preHandler: requireAuth }, async (req, reply) => {
    const q = listQuery.parse(req.query);
    const items = await prisma.alert.findMany({
      where: {
        ...(q.acknowledged !== undefined ? { acknowledged: q.acknowledged } : {}),
        ...(q.severity ? { severity: q.severity } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: q.limit,
      include: { container: { select: { id: true, isoCode: true } } },
    });
    return reply.send({
      items: items.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  });

  app.patch("/alerts/:id/ack", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.kind === "user" ? req.user.sub : null;
    const alert = await prisma.alert.update({
      where: { id },
      data: { acknowledged: true, acknowledgedBy: userId },
    });
    const wire = { ...alert, createdAt: alert.createdAt.toISOString() };
    broadcastToDashboards({
      type: "alert.acknowledged",
      payload: { alert: wire },
      ts: Date.now(),
    });
    return reply.send({ alert: wire });
  });
}
