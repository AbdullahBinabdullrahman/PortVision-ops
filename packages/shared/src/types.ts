/* ============================================================================
 * PortVision shared domain types — single source of truth for API + Web + Sim.
 * Mirrors the database schema in apps/api/prisma/schema.prisma.
 * ============================================================================ */

export type ID = string;
export type ISODateString = string;

/* ----------- Enums ----------- */

export type UserRole = "admin" | "viewer";

export type OperatorRole = "inspector" | "supervisor" | "crane_op";

export type ContainerStatus =
  | "empty"
  | "loaded"
  | "in_transit"
  | "inspection";

export type SensorType = "temp" | "humidity" | "tilt" | "shock";

export type HeadsetStatus = "online" | "offline" | "charging";

export type ConnectivityLink = "5g" | "wifi" | "offline";

export type ActionType = "inspect" | "flag" | "note" | "dispatch";

export type AlertSeverity = "info" | "warn" | "critical";

export type AuditAction = "insert" | "update" | "delete";

/* ----------- Entities ----------- */

export interface User {
  id: ID;
  email: string;
  role: UserRole;
  createdAt: ISODateString;
}

export interface Operator {
  id: ID;
  name: string;
  role: OperatorRole;
  language: string;
  active: boolean;
}

export interface Headset {
  id: ID;
  operatorId: ID | null;
  deviceModel: string;
  serialNumber: string;
  batteryLevel: number;
  status: HeadsetStatus;
  link: ConnectivityLink;
  rssi: number | null;
  lastSeenAt: ISODateString | null;
}

export interface Container {
  id: ID;
  isoCode: string;
  bleBeaconId: string | null;
  status: ContainerStatus;
  locationLat: number | null;
  locationLng: number | null;
  cargoType: string | null;
  lastInspectedAt: ISODateString | null;
}

export interface SensorReading {
  id: ID;
  containerId: ID;
  sensorType: SensorType;
  value: SensorReadingValue;
  recordedAt: ISODateString;
}

export type SensorReadingValue =
  | { kind: "temp"; celsius: number }
  | { kind: "humidity"; percent: number }
  | { kind: "tilt"; degrees: number }
  | { kind: "shock"; g: number };

export interface Action {
  id: ID;
  containerId: ID;
  operatorId: ID;
  headsetId: ID | null;
  actionType: ActionType;
  payload: Record<string, unknown>;
  createdAt: ISODateString;
}

export interface Alert {
  id: ID;
  containerId: ID;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  acknowledgedBy: ID | null;
  createdAt: ISODateString;
}

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: ID | null;
  action: AuditAction;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  performedBy: ID | null;
  performedAt: ISODateString;
}

/* ----------- Aggregated views (used by ops dashboard) ----------- */

export interface OpsHealth {
  api: { ok: true; uptimeSeconds: number };
  db: { ok: boolean; latencyMs: number | null };
  mqtt: { connected: boolean; broker: string };
  zigbee2mqtt: { ok: boolean; mode: "stub" | "real" };
  ws: { headsetClients: number; dashboardClients: number };
  iot: {
    bleBeacons: number;
    zigbeeSensors: number;
    onlineSensors: number;
  };
  fiveG: {
    headsetsOn5g: number;
    headsetsOnWifi: number;
    headsetsOffline: number;
    avgRssiDbm: number | null;
  };
  simMode: boolean;
}
