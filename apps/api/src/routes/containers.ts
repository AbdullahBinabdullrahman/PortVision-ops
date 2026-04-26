import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const listQuery = z.object({
  status: z.enum(["empty", "loaded", "in_transit", "inspection"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const updateBody = z.object({
  status: z.enum(["empty", "loaded", "in_transit", "inspection"]).optional(),
  cargoType: z.string().nullable().optional(),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
});

export async function containerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/containers", { preHandler: requireAuth }, async (req, reply) => {
    const q = listQuery.parse(req.query);
    const [items, total] = await Promise.all([
      prisma.container.findMany({
        where: q.status ? { status: q.status } : undefined,
        orderBy: { isoCode: "asc" },
        take: q.limit,
        skip: q.offset,
      }),
      prisma.container.count({ where: q.status ? { status: q.status } : undefined }),
    ]);
    return reply.send({ items: items.map(serialize), total });
  });

  app.get("/containers/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const container = await prisma.container.findUnique({ where: { id } });
    if (!container) return reply.code(404).send({ error: "not_found" });
    const [recentReadings, openAlerts, recentActions] = await Promise.all([
      prisma.sensorReading.findMany({
        where: { containerId: id },
        orderBy: { recordedAt: "desc" },
        take: 50,
      }),
      prisma.alert.findMany({
        where: { containerId: id, acknowledged: false },
        orderBy: { createdAt: "desc" },
      }),
      prisma.action.findMany({
        where: { containerId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { operator: { select: { id: true, name: true } } },
      }),
    ]);
    return reply.send({
      container: serialize(container),
      recentReadings: recentReadings.map((r) => ({
        ...r,
        recordedAt: r.recordedAt.toISOString(),
      })),
      openAlerts: openAlerts.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
      recentActions: recentActions.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  });

  app.patch("/containers/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const updated = await prisma.container.update({
      where: { id },
      data: parsed.data,
    });
    return reply.send({ container: serialize(updated) });
  });
}

function serialize(c: {
  id: string;
  isoCode: string;
  bleBeaconId: string | null;
  status: string;
  locationLat: unknown;
  locationLng: unknown;
  cargoType: string | null;
  lastInspectedAt: Date | null;
}) {
  return {
    id: c.id,
    isoCode: c.isoCode,
    bleBeaconId: c.bleBeaconId,
    status: c.status,
    locationLat: c.locationLat ? Number(c.locationLat) : null,
    locationLng: c.locationLng ? Number(c.locationLng) : null,
    cargoType: c.cargoType,
    lastInspectedAt: c.lastInspectedAt?.toISOString() ?? null,
  };
}
