import type { FastifyBaseLogger } from "fastify";
import { SENSOR_WILDCARD, type MqttSensorPayload } from "@portvision/shared/mqtt-topics";
import type { SensorReadingValue, SensorType } from "@portvision/shared/types";
import { prisma } from "../db.js";
import { broadcastToDashboards } from "../ws/server.js";
import { connectMqtt } from "./client.js";
import { evaluateAlertRules } from "./alert-engine.js";

const VALID_TYPES: ReadonlySet<SensorType> = new Set(["temp", "humidity", "tilt", "shock"]);

export function startMqttIngest(log: FastifyBaseLogger): void {
  const client = connectMqtt(log);

  client.on("connect", () => {
    client.subscribe(SENSOR_WILDCARD, { qos: 0 }, (err) => {
      if (err) log.error({ err }, "mqtt subscribe failed");
      else log.info({ topic: SENSOR_WILDCARD }, "mqtt subscribed");
    });
  });

  client.on("message", async (topic, message) => {
    let parsed: MqttSensorPayload;
    try {
      parsed = JSON.parse(message.toString()) as MqttSensorPayload;
    } catch {
      log.warn({ topic }, "mqtt: invalid json payload");
      return;
    }

    if (!VALID_TYPES.has(parsed.sensorType)) return;

    const value = encodeSensorValue(parsed.sensorType, parsed.value);

    try {
      const reading = await prisma.sensorReading.create({
        data: {
          containerId: parsed.containerId,
          sensorType: parsed.sensorType,
          value,
          recordedAt: parsed.recordedAt ? new Date(parsed.recordedAt) : new Date(),
        },
      });

      broadcastToDashboards({
        type: "sensor.update",
        payload: {
          reading: {
            id: reading.id,
            containerId: reading.containerId,
            sensorType: reading.sensorType,
            value,
            recordedAt: reading.recordedAt.toISOString(),
          },
        },
        ts: Date.now(),
      });

      await evaluateAlertRules(reading.containerId, parsed.sensorType, parsed.value);
    } catch (err) {
      log.error({ err, topic }, "mqtt ingest db write failed");
    }
  });
}

function encodeSensorValue(sensorType: SensorType, raw: number): SensorReadingValue {
  switch (sensorType) {
    case "temp":
      return { kind: "temp", celsius: raw };
    case "humidity":
      return { kind: "humidity", percent: raw };
    case "tilt":
      return { kind: "tilt", degrees: raw };
    case "shock":
      return { kind: "shock", g: raw };
  }
}
