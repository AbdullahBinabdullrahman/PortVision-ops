import { WebSocket } from "ws";
import type {
  ActionSubmitMsg,
  ContainerIdentifyMsg,
  HeadsetTelemetryMsg,
  ServerToHeadsetMsg,
} from "@portvision/shared/ws-protocol";
import type { ConnectivityLink } from "@portvision/shared/types";

const WS_URL = process.env.SIM_WS_URL ?? "ws://localhost:4000/ws";

interface FakeHeadset {
  id: string;
  deviceModel: string;
  serialNumber: string;
}

interface ContainerForHeadset {
  id: string;
  isoCode: string;
  bleBeaconId: string | null;
}

const ACTION_TYPES = ["inspect", "flag", "note", "dispatch"] as const;

function pickLink(): ConnectivityLink {
  const r = Math.random();
  if (r < 0.6) return "5g";
  if (r < 0.95) return "wifi";
  return "offline";
}

export async function runFakeHeadset({
  headset,
  token,
  containers,
  intervalMs,
}: {
  headset: FakeHeadset;
  token: string;
  containers: ContainerForHeadset[];
  intervalMs: number;
}): Promise<void> {
  const url = `${WS_URL}?role=headset&token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);

  let battery = 100;
  let ticker: ReturnType<typeof setInterval> | null = null;

  ws.on("open", () => {
    console.log(`🥽 headset ${headset.serialNumber} (${headset.deviceModel}) connected`);

    ticker = setInterval(() => {
      battery = Math.max(0, battery - Math.random() * 0.4);

      const link = pickLink();
      const telemetry: HeadsetTelemetryMsg = {
        type: "headset.telemetry",
        payload: {
          headsetId: headset.id,
          battery: Math.round(battery),
          link,
          rssi: link === "offline" ? null : link === "5g" ? -60 - Math.random() * 25 : -45 - Math.random() * 15,
          position: {
            lat: 25.0167 + (Math.random() - 0.5) * 0.005,
            lng: 55.0833 + (Math.random() - 0.5) * 0.005,
          },
        },
      };
      send(ws, telemetry);

      // Occasionally identify a container, then submit an action.
      if (Math.random() < 0.3) {
        const c = containers[Math.floor(Math.random() * containers.length)];
        if (!c) return;
        const identify: ContainerIdentifyMsg = c.bleBeaconId
          ? { type: "container.identify", payload: { mode: "ble", bleBeaconId: c.bleBeaconId } }
          : { type: "container.identify", payload: { mode: "vision", isoCode: c.isoCode } };
        send(ws, identify);

        if (Math.random() < 0.5) {
          const action: ActionSubmitMsg = {
            type: "action.submit",
            payload: {
              containerId: c.id,
              actionType: ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)]!,
              payload: { source: "sim", note: "auto-generated" },
            },
          };
          send(ws, action);
        }
      }
    }, intervalMs);
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as ServerToHeadsetMsg;
      if (msg.type === "container.data") {
        // headset would render the AR HUD here
      } else if (msg.type === "sensor.alert") {
        console.log(
          `   🚨 ${headset.serialNumber} got alert: ${msg.payload.alert.severity} - ${msg.payload.alert.message}`
        );
      }
    } catch {
      // ignore
    }
  });

  ws.on("close", () => {
    if (ticker) clearInterval(ticker);
    console.log(`🥽 headset ${headset.serialNumber} disconnected, retrying in 3s`);
    setTimeout(() => runFakeHeadset({ headset, token, containers, intervalMs }), 3000);
  });

  ws.on("error", (err) => {
    console.error(`headset ${headset.serialNumber} ws error:`, err.message);
  });
}

function send(ws: WebSocket, msg: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...msg, ts: Date.now() }));
  }
}
