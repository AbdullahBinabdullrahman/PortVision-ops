import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const createBody = z.object({
  name: z.string().min(1),
  role: z.enum(["inspector", "supervisor", "crane_op"]),
  language: z.string().default("en"),
});

const updateBody = createBody.partial().extend({ active: z.boolean().optional() });

export async function operatorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/operators", { preHandler: requireAuth }, async (_req, reply) => {
    const items = await prisma.operator.findMany({
      orderBy: { name: "asc" },
      include: {
        headsets: { select: { id: true, deviceModel: true, status: true } },
        _count: { select: { actions: true } },
      },
    });
    return reply.send({ items });
  });

  app.post("/operators", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const op = await prisma.operator.create({ data: parsed.data });
    return reply.code(201).send({ operator: op });
  });

  app.patch("/operators/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const op = await prisma.operator.update({ where: { id }, data: parsed.data });
    return reply.send({ operator: op });
  });

  app.get("/operators/:id/activity", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const actions = await prisma.action.findMany({
      where: { operatorId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { container: { select: { id: true, isoCode: true } } },
    });
    return reply.send({
      items: actions.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  });
}
