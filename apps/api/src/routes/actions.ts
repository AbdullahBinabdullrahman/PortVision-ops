import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { broadcastToDashboards } from "../ws/server.js";

const createBody = z.object({
  containerId: z.string().uuid(),
  operatorId: z.string().uuid(),
  headsetId: z.string().uuid().nullable().optional(),
  actionType: z.enum(["inspect", "flag", "note", "dispatch"]),
  payload: z.record(z.unknown()).default({}),
});

const listQuery = z.object({
  operatorId: z.string().uuid().optional(),
  containerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function actionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/actions", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const action = await prisma.action.create({
      data: parsed.data,
      include: {
        operator: { select: { name: true } },
        container: { select: { isoCode: true } },
      },
    });
    const wire = { ...action, createdAt: action.createdAt.toISOString(), payload: action.payload as Record<string, unknown> };
    broadcastToDashboards({
      type: "action.created",
      payload: { action: wire },
      ts: Date.now(),
    });
    return reply.code(201).send({ action: wire });
  });

  app.get("/actions", { preHandler: requireAuth }, async (req, reply) => {
    const q = listQuery.parse(req.query);
    const items = await prisma.action.findMany({
      where: {
        ...(q.operatorId ? { operatorId: q.operatorId } : {}),
        ...(q.containerId ? { containerId: q.containerId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: q.limit,
      include: {
        operator: { select: { id: true, name: true } },
        container: { select: { id: true, isoCode: true } },
      },
    });
    return reply.send({
      items: items.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  });
}
