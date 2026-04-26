import mqtt, { type MqttClient } from "mqtt";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";

let client: MqttClient | null = null;
let connected = false;

export function getMqttClient(): MqttClient | null {
  return client;
}

export function isMqttConnected(): boolean {
  return connected;
}

export function getMqttBroker(): string {
  return env.MQTT_URL;
}

export function connectMqtt(log: FastifyBaseLogger): MqttClient {
  if (client) return client;
  client = mqtt.connect(env.MQTT_URL, {
    clientId: `${env.MQTT_CLIENT_ID}-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    connected = true;
    log.info({ broker: env.MQTT_URL }, "mqtt connected");
  });
  client.on("reconnect", () => log.warn({ broker: env.MQTT_URL }, "mqtt reconnecting"));
  client.on("offline", () => {
    connected = false;
    log.warn("mqtt offline");
  });
  client.on("close", () => {
    connected = false;
  });
  client.on("error", (err) => log.error({ err }, "mqtt error"));

  return client;
}
