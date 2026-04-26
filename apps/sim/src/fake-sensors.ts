import mqtt from "mqtt";
import { sensorTopic, type MqttSensorPayload } from "@portvision/shared/mqtt-topics";
import type { SensorType } from "@portvision/shared/types";

const BROKER = process.env.SIM_MQTT_URL ?? "mqtt://localhost:1883";

const TYPES: SensorType[] = ["temp", "humidity", "tilt", "shock"];

interface SensorContainer {
  id: string;
  isoCode: string;
}

function nominal(type: SensorType): number {
  switch (type) {
    case "temp":
      return 18 + (Math.random() - 0.5) * 6;
    case "humidity":
      return 55 + (Math.random() - 0.5) * 20;
    case "tilt":
      return Math.random() * 5;
    case "shock":
      return Math.random() * 1.5;
  }
}

function unit(type: SensorType): string {
  return type === "temp" ? "C" : type === "humidity" ? "%" : type === "tilt" ? "deg" : "G";
}

// Occasionally emit an out-of-range reading so the alert engine fires.
function occasionalAnomaly(type: SensorType, base: number): number {
  if (Math.random() < 0.05) {
    switch (type) {
      case "temp":
        return 60;
      case "humidity":
        return 99;
      case "tilt":
        return 35;
      case "shock":
        return 9;
    }
  }
  return base;
}

export async function runFakeSensors({
  containers,
  intervalMs,
}: {
  containers: SensorContainer[];
  intervalMs: number;
}): Promise<void> {
  const client = mqtt.connect(BROKER, {
    clientId: `pv-sim-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
  });

  await new Promise<void>((resolve) => {
    client.once("connect", () => {
      console.log(`🛰  sensor sim connected to ${BROKER}`);
      resolve();
    });
  });

  setInterval(() => {
    for (const c of containers) {
      // Each tick, pick 1–2 sensor types per container so we don't flood.
      const t = TYPES[Math.floor(Math.random() * TYPES.length)]!;
      const value = occasionalAnomaly(t, nominal(t));
      const payload: MqttSensorPayload = {
        containerId: c.id,
        sensorType: t,
        value,
        unit: unit(t),
        recordedAt: new Date().toISOString(),
      };
      client.publish(sensorTopic(c.id, t), JSON.stringify(payload), { qos: 0 });
    }
  }, intervalMs);
}
