import type { SensorType, AlertSeverity } from "@portvision/shared/types";
import { prisma } from "../db.js";
import { broadcastToDashboards } from "../ws/server.js";

interface Threshold {
  warn?: { min?: number; max?: number };
  critical?: { min?: number; max?: number };
  unit: string;
}

const THRESHOLDS: Record<SensorType, Threshold> = {
  temp: {
    warn: { min: -10, max: 40 },
    critical: { min: -20, max: 55 },
    unit: "°C",
  },
  humidity: {
    warn: { max: 85 },
    critical: { max: 95 },
    unit: "%",
  },
  tilt: {
    warn: { max: 15 },
    critical: { max: 30 },
    unit: "°",
  },
  shock: {
    warn: { max: 4 },
    critical: { max: 8 },
    unit: "G",
  },
};

function classify(t: Threshold, v: number): AlertSeverity | null {
  if (t.critical) {
    if (t.critical.max !== undefined && v > t.critical.max) return "critical";
    if (t.critical.min !== undefined && v < t.critical.min) return "critical";
  }
  if (t.warn) {
    if (t.warn.max !== undefined && v > t.warn.max) return "warn";
    if (t.warn.min !== undefined && v < t.warn.min) return "warn";
  }
  return null;
}

export async function evaluateAlertRules(
  containerId: string,
  sensorType: SensorType,
  value: number
): Promise<void> {
  const t = THRESHOLDS[sensorType];
  const severity = classify(t, value);
  if (!severity) return;

  const message = `${labelFor(sensorType)} ${value.toFixed(1)}${t.unit} exceeds ${severity} threshold`;

  // Avoid alert spam: skip if an unacknowledged alert with same severity exists
  // for this container in the last 5 minutes.
  const recent = await prisma.alert.findFirst({
    where: {
      containerId,
      severity,
      acknowledged: false,
      createdAt: { gte: new Date(Date.now() - 5 * 60_000) },
    },
  });
  if (recent) return;

  const alert = await prisma.alert.create({
    data: { containerId, severity, message },
  });

  broadcastToDashboards({
    type: "alert.new",
    payload: {
      alert: {
        ...alert,
        createdAt: alert.createdAt.toISOString(),
      },
    },
    ts: Date.now(),
  });
}

function labelFor(t: SensorType): string {
  switch (t) {
    case "temp":
      return "Temperature";
    case "humidity":
      return "Humidity";
    case "tilt":
      return "Tilt";
    case "shock":
      return "Shock";
  }
}
