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

interface WsBase {
  ts?: number;
  requestId?: string;
}

/* ----------- Headset → Server ----------- */

export interface HeadsetTelemetryMsg extends WsBase {
  type: "headset.telemetry";
  payload: {
    headsetId: ID;
    battery: number;
    link: ConnectivityLink;
    rssi: number | null;
    position?: { lat: number; lng: number };
  };
}

export interface ContainerIdentifyMsg extends WsBase {
  type: "container.identify";
  payload:
    | { mode: "ble"; bleBeaconId: string }
    | { mode: "vision"; isoCode: string };
}

export interface ActionSubmitMsg extends WsBase {
  type: "action.submit";
  payload: {
    containerId: ID;
    actionType: Action["actionType"];
    payload: Record<string, unknown>;
  };
}

/* ----------- Server → Headset ----------- */

export interface ContainerDataMsg extends WsBase {
  type: "container.data";
  payload: {
    container: Container;
    recentReadings: SensorReading[];
    openAlerts: Alert[];
  };
}

export interface ActionAckMsg extends WsBase {
  type: "action.ack";
  payload: { action: Action };
}

export interface SensorAlertMsg extends WsBase {
  type: "sensor.alert";
  payload: { alert: Alert; container: Container };
}

/* ----------- Server → Dashboard ----------- */

export interface HeadsetStatusMsg extends WsBase {
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

export interface SensorUpdateMsg extends WsBase {
  type: "sensor.update";
  payload: { reading: SensorReading };
}

export interface ActionCreatedMsg extends WsBase {
  type: "action.created";
  payload: { action: Action };
}

export interface AlertNewMsg extends WsBase {
  type: "alert.new";
  payload: { alert: Alert };
}

export interface AlertAcknowledgedMsg extends WsBase {
  type: "alert.acknowledged";
  payload: { alert: Alert };
}

export interface HeadsetSnapshotMsg extends WsBase {
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
