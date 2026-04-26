import type { FastifyBaseLogger } from "fastify";
import { Prisma } from "@prisma/client";
import type {
  AnyWsMessage,
  HeadsetToServerMsg,
} from "@portvision/shared/ws-protocol";
import type {
  ConnectivityLink,
  HeadsetStatus,
  SensorReadingValue,
} from "@portvision/shared/types";
import { prisma } from "../db.js";
import { broadcastToDashboards, type WsClient } from "./server.js";

function isHeadsetMsg(msg: AnyWsMessage): msg is HeadsetToServerMsg {
  return (
    msg.type === "headset.telemetry" ||
    msg.type === "container.identify" ||
    msg.type === "action.submit"
  );
}

const linkToEnum: Record<ConnectivityLink, "five_g" | "wifi" | "offline"> = {
  "5g": "five_g",
  wifi: "wifi",
  offline: "offline",
};

export async function handleHeadsetMessage(
  client: WsClient,
  msg: AnyWsMessage,
  log: FastifyBaseLogger
): Promise<void> {
  if (!isHeadsetMsg(msg) || !client.headsetId) return;

  switch (msg.type) {
    case "headset.telemetry": {
      const p = msg.payload;
      const status: HeadsetStatus = p.battery < 5 ? "charging" : "online";
      const updated = await prisma.headset.update({
        where: { id: client.headsetId },
        data: {
          batteryLevel: Math.round(p.battery),
          link: linkToEnum[p.link],
          rssi: p.rssi ?? null,
          status,
          lastSeenAt: new Date(),
        },
      });
      broadcastToDashboards({
        type: "headset.status",
        payload: {
          headsetId: updated.id,
          status: updated.status,
          link: (updated.link === "five_g" ? "5g" : updated.link) as ConnectivityLink,
          battery: updated.batteryLevel,
          rssi: updated.rssi,
          lastSeenAt: updated.lastSeenAt?.toISOString() ?? new Date().toISOString(),
        },
        ts: Date.now(),
      });
      return;
    }

    case "container.identify": {
      const where =
        msg.payload.mode === "ble"
          ? { bleBeaconId: msg.payload.bleBeaconId }
          : { isoCode: msg.payload.isoCode };
      const container = await prisma.container.findFirst({ where });
      if (!container) {
        client.socket.send(
          JSON.stringify({
            type: "container.data",
            payload: { error: "not_found" },
            ts: Date.now(),
          })
        );
        return;
      }
      const [recentReadings, openAlerts] = await Promise.all([
        prisma.sensorReading.findMany({
          where: { containerId: container.id },
          orderBy: { recordedAt: "desc" },
          take: 20,
        }),
        prisma.alert.findMany({
          where: { containerId: container.id, acknowledged: false },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      client.socket.send(
        JSON.stringify({
          type: "container.data",
          payload: {
            container: serializeContainer(container),
            recentReadings: recentReadings.map((r) => ({
              ...r,
              value: r.value as SensorReadingValue,
              recordedAt: r.recordedAt.toISOString(),
            })),
            openAlerts: openAlerts.map((a) => ({
              ...a,
              createdAt: a.createdAt.toISOString(),
            })),
          },
          ts: Date.now(),
        })
      );
      return;
    }

    case "action.submit": {
      const headset = await prisma.headset.findUnique({
        where: { id: client.headsetId },
      });
      if (!headset?.operatorId) {
        log.warn({ headsetId: client.headsetId }, "action.submit from unassigned headset");
        return;
      }
      const action = await prisma.action.create({
        data: {
          containerId: msg.payload.containerId,
          operatorId: headset.operatorId,
          headsetId: headset.id,
          actionType: msg.payload.actionType,
          payload: msg.payload.payload as Prisma.InputJsonValue,
        },
      });
      const wire = { ...action, createdAt: action.createdAt.toISOString(), payload: action.payload as Record<string, unknown> };
      client.socket.send(
        JSON.stringify({ type: "action.ack", payload: { action: wire }, ts: Date.now() })
      );
      broadcastToDashboards({
        type: "action.created",
        payload: { action: wire },
        ts: Date.now(),
      });
      return;
    }
  }
}

function serializeContainer(c: {
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
    status: c.status as never,
    locationLat: c.locationLat ? Number(c.locationLat) : null,
    locationLng: c.locationLng ? Number(c.locationLng) : null,
    cargoType: c.cargoType,
    lastInspectedAt: c.lastInspectedAt?.toISOString() ?? null,
  };
}
