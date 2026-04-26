import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";

const recentQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  sensorType: z.enum(["temp", "humidity", "tilt", "shock"]).optional(),
});

export async function sensorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/sensors/recent", { preHandler: requireAuth }, async (req, reply) => {
    const q = recentQuery.parse(req.query);
    const items = await prisma.sensorReading.findMany({
      where: q.sensorType ? { sensorType: q.sensorType } : undefined,
      orderBy: { recordedAt: "desc" },
      take: q.limit,
      include: { container: { select: { id: true, isoCode: true } } },
    });
    return reply.send({
      items: items.map((r) => ({
        ...r,
        recordedAt: r.recordedAt.toISOString(),
      })),
    });
  });

  // Per-container time-series — latest N readings, optionally per type.
  app.get("/containers/:id/readings", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const q = recentQuery.parse(req.query);
    const items = await prisma.sensorReading.findMany({
      where: {
        containerId: id,
        ...(q.sensorType ? { sensorType: q.sensorType } : {}),
      },
      orderBy: { recordedAt: "desc" },
      take: q.limit,
    });
    return reply.send({
      items: items.map((r) => ({ ...r, recordedAt: r.recordedAt.toISOString() })),
    });
  });

  // IoT device inventory grouped by container — what BLE/Zigbee devices we know about.
  app.get("/iot/inventory", { preHandler: requireAuth }, async (_req, reply) => {
    const containers = await prisma.container.findMany({
      select: {
        id: true,
        isoCode: true,
        bleBeaconId: true,
        readings: {
          orderBy: { recordedAt: "desc" },
          take: 1,
          select: { sensorType: true, recordedAt: true, value: true },
        },
      },
    });
    return reply.send({
      items: containers.map((c) => ({
        containerId: c.id,
        isoCode: c.isoCode,
        bleBeaconId: c.bleBeaconId,
        lastReading: c.readings[0]
          ? {
              sensorType: c.readings[0].sensorType,
              value: c.readings[0].value,
              recordedAt: c.readings[0].recordedAt.toISOString(),
            }
          : null,
      })),
    });
  });
}
