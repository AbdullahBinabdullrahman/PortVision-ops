/* ============================================================================
 * WebSocket protocol shared by API server, Unity headset client, web dashboard.
 *
 * Single envelope: { type, payload, ts, requestId? }.
 * Client identifies its role on the upgrade query string: ?role=headset|dashboard
 * and supplies a JWT (Authorization header for headsets, cookie for dashboards).
 * ============================================================================ */

import type {
  Action,
  Alert,
  Container,
  ConnectivityLink,
  Headset,
  HeadsetStatus,
  ID,
  SensorReading,
} from "./types.js";

export const WS_PATH = "/ws";

export type WsRole = "headset" | "dashboard";

export interface WsEnvelope<T = unknown> {
  type: string;
  payload: T;
  ts: number;
  requestId?: string;
}

/* ----------- Headset → Server ----------- */

export interface HeadsetTelemetryMsg {
  type: "headset.telemetry";
  payload: {
    headsetId: ID;
    battery: number;
    link: ConnectivityLink;
    rssi: number | null;
    position?: { lat: number; lng: number };
  };
}

export interface ContainerIdentifyMsg {
  type: "container.identify";
  payload:
    | { mode: "ble"; bleBeaconId: string }
    | { mode: "vision"; isoCode: string };
}

export interface ActionSubmitMsg {
  type: "action.submit";
  payload: {
    containerId: ID;
    actionType: Action["actionType"];
    payload: Record<string, unknown>;
  };
}

/* ----------- Server → Headset ----------- */

export interface ContainerDataMsg {
  type: "container.data";
  payload: {
    container: Container;
    recentReadings: SensorReading[];
    openAlerts: Alert[];
  };
}

export interface ActionAckMsg {
  type: "action.ack";
  payload: { action: Action };
}

export interface SensorAlertMsg {
  type: "sensor.alert";
  payload: { alert: Alert; container: Container };
}

/* ----------- Server → Dashboard ----------- */

export interface HeadsetStatusMsg {
  type: "headset.status";
  payload: {
    headsetId: ID;
    status: HeadsetStatus;
    link: ConnectivityLink;
    battery: number;
    rssi: number | null;
    lastSeenAt: string;
  };
}

export interface SensorUpdateMsg {
  type: "sensor.update";
  payload: { reading: SensorReading };
}

export interface ActionCreatedMsg {
  type: "action.created";
  payload: { action: Action };
}

export interface AlertNewMsg {
  type: "alert.new";
  payload: { alert: Alert };
}

export interface AlertAcknowledgedMsg {
  type: "alert.acknowledged";
  payload: { alert: Alert };
}

export interface HeadsetSnapshotMsg {
  type: "headset.snapshot";
  payload: { headsets: Headset[] };
}

export type ServerToHeadsetMsg =
  | ContainerDataMsg
  | ActionAckMsg
  | SensorAlertMsg;

export type ServerToDashboardMsg =
  | HeadsetStatusMsg
  | SensorUpdateMsg
  | ActionCreatedMsg
  | AlertNewMsg
  | AlertAcknowledgedMsg
  | HeadsetSnapshotMsg;

export type HeadsetToServerMsg =
  | HeadsetTelemetryMsg
  | ContainerIdentifyMsg
  | ActionSubmitMsg;

export type AnyWsMessage =
  | HeadsetToServerMsg
  | ServerToHeadsetMsg
  | ServerToDashboardMsg;
