/* ============================================================================
 * PortVision simulator.
 *
 *   1. Logs into the API as admin.
 *   2. Picks N headsets + their containers from the DB.
 *   3. For each headset: provisions a JWT and connects via WebSocket as a
 *      headset, then streams telemetry + occasional BLE-scan actions.
 *   4. For each container with a BLE beacon: publishes Zigbee2MQTT-style
 *      sensor readings on the relevant MQTT topic.
 *
 * Run with:   pnpm sim:start
 * Tunables:   SIM_HEADSETS, SIM_SENSORS, SIM_INTERVAL_MS  (see .env.example)
 * ============================================================================ */

import { runFakeSensors } from "./fake-sensors.js";
import { runFakeHeadset } from "./fake-headset.js";

const API = process.env.SIM_API_URL ?? "http://localhost:4000";
const NUM_HEADSETS = Number(process.env.SIM_HEADSETS ?? 3);
const NUM_SENSORS = Number(process.env.SIM_SENSORS ?? 20);
const INTERVAL = Number(process.env.SIM_INTERVAL_MS ?? 2000);

interface LoginRes {
  token: string;
}

interface ListHeadsetsRes {
  items: { id: string; deviceModel: string; serialNumber: string }[];
}

interface ListContainersRes {
  items: { id: string; isoCode: string; bleBeaconId: string | null }[];
}

interface IssueTokenRes {
  token: string;
}

async function main(): Promise<void> {
  console.log(`🔌 connecting to ${API}`);

  const loginRes = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@portvision.local",
      password: "portvision",
    }),
  });
  if (!loginRes.ok) {
    throw new Error(`login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const { token: adminToken } = (await loginRes.json()) as LoginRes;
  const authHeaders = { Authorization: `Bearer ${adminToken}` };

  const [headsetsRes, containersRes] = await Promise.all([
    fetch(`${API}/api/v1/headsets`, { headers: authHeaders }),
    fetch(`${API}/api/v1/containers?limit=200`, { headers: authHeaders }),
  ]);

  const headsets = ((await headsetsRes.json()) as ListHeadsetsRes).items;
  const containers = ((await containersRes.json()) as ListContainersRes).items.filter(
    (c) => c.bleBeaconId
  );

  if (headsets.length === 0) {
    console.error("no headsets in DB — run `pnpm db:seed` first");
    process.exit(1);
  }
  if (containers.length === 0) {
    console.error("no containers with BLE beacons in DB — run `pnpm db:seed` first");
    process.exit(1);
  }

  const targetHeadsets = headsets.slice(0, NUM_HEADSETS);
  const targetContainers = containers.slice(0, NUM_SENSORS);

  console.log(
    `🎮 launching ${targetHeadsets.length} fake headset(s), ${targetContainers.length} fake sensor(s)`
  );

  // Start sensors first — pubs to MQTT independent of headsets.
  void runFakeSensors({ containers: targetContainers, intervalMs: INTERVAL });

  // For each fake headset, mint a JWT (kind=headset) and connect.
  for (const headset of targetHeadsets) {
    const r = await fetch(`${API}/api/v1/headsets/${headset.id}/issue-token`, {
      method: "POST",
      headers: authHeaders,
    });
    if (!r.ok) {
      console.error(`could not issue token for ${headset.serialNumber}`);
      continue;
    }
    const { token } = (await r.json()) as IssueTokenRes;
    void runFakeHeadset({
      headset,
      token,
      containers: targetContainers,
      intervalMs: INTERVAL,
    });
  }

  console.log("🟢 sim running — Ctrl-C to stop");

  process.on("SIGINT", () => {
    console.log("\n👋 sim stopping");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
