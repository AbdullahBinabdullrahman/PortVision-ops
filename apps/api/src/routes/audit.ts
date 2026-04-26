import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const listQuery = z.object({
  tableName: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.get("/audit-log", { preHandler: requireAuth }, async (req, reply) => {
    const q = listQuery.parse(req.query);
    const items = await prisma.auditLog.findMany({
      where: q.tableName ? { tableName: q.tableName } : undefined,
      orderBy: { performedAt: "desc" },
      take: q.limit,
    });
    return reply.send({
      items: items.map((a) => ({
        ...a,
        id: a.id.toString(),
        performedAt: a.performedAt.toISOString(),
      })),
    });
  });
}
