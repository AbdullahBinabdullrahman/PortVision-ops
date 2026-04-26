/* ============================================================================
 * MQTT topic conventions for PortVision.
 *
 *   portvision/sensor/<containerId>/<sensorType>     (Zigbee2MQTT bridge → API)
 *   portvision/sensor/+/+                            (API subscription pattern)
 *   portvision/headset/<headsetId>/telemetry         (alt path: heartbeat over MQTT)
 *   portvision/system/health                         (broker-side heartbeat)
 * ============================================================================ */

import type { ID, SensorType } from "./types.js";

export const ROOT = "portvision";

export const sensorTopic = (containerId: ID, sensorType: SensorType) =>
  `${ROOT}/sensor/${containerId}/${sensorType}`;

export const SENSOR_WILDCARD = `${ROOT}/sensor/+/+`;

export const headsetTelemetryTopic = (headsetId: ID) =>
  `${ROOT}/headset/${headsetId}/telemetry`;

export const HEADSET_TELEMETRY_WILDCARD = `${ROOT}/headset/+/telemetry`;

export const SYSTEM_HEALTH = `${ROOT}/system/health`;

export interface MqttSensorPayload {
  containerId: ID;
  sensorType: SensorType;
  value: number;
  unit: string;
  recordedAt: string;
}
