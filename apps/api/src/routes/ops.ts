import type { FastifyInstance } from "fastify";
import type { OpsHealth } from "@portvision/shared/types";
import { pingDb, prisma } from "../db.js";
import { getMqttBroker, isMqttConnected } from "../mqtt/client.js";
import { getWsCounts } from "../ws/server.js";

const startedAt = Date.now();

export async function opsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/ops/health", async (_req, reply) => {
    const [db, headsetCounts, sensorContainerCount, recentReadingCount] = await Promise.all([
      pingDb(),
      prisma.headset.groupBy({
        by: ["link"],
        _count: { _all: true },
        _avg: { rssi: true },
      }),
      prisma.container.count({ where: { bleBeaconId: { not: null } } }),
      prisma.sensorReading.count({
        where: { recordedAt: { gte: new Date(Date.now() - 5 * 60_000) } },
      }),
    ]);

    const five = headsetCounts.find((h) => h.link === "five_g");
    const wifi = headsetCounts.find((h) => h.link === "wifi");
    const off = headsetCounts.find((h) => h.link === "offline");

    const wsCounts = getWsCounts();

    const health: OpsHealth = {
      api: { ok: true, uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) },
      db,
      mqtt: { connected: isMqttConnected(), broker: getMqttBroker() },
      zigbee2mqtt: { ok: isMqttConnected(), mode: "stub" },
      ws: wsCounts,
      iot: {
        bleBeacons: sensorContainerCount,
        zigbeeSensors: 0, // populated when real Z2M is wired up
        onlineSensors: recentReadingCount,
      },
      fiveG: {
        headsetsOn5g: five?._count._all ?? 0,
        headsetsOnWifi: wifi?._count._all ?? 0,
        headsetsOffline: off?._count._all ?? 0,
        avgRssiDbm: five?._avg.rssi ?? null,
      },
      simMode: process.env.PORTVISION_SIM_MODE === "1",
    };
    return reply.send(health);
  });
}
