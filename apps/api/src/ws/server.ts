import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import type { FastifyInstance } from "fastify";
import { WebSocketServer, type WebSocket } from "ws";
import {
  WS_PATH,
  type AnyWsMessage,
  type ServerToDashboardMsg,
  type ServerToHeadsetMsg,
  type WsRole,
} from "@portvision/shared/ws-protocol";
import { env } from "../env.js";
import { verifyToken, type JwtPayload } from "../auth/jwt.js";
import { handleHeadsetMessage } from "./headset-channel.js";

export interface WsClient {
  socket: WebSocket;
  role: WsRole;
  user: JwtPayload;
  headsetId?: string;
}

const headsets = new Map<WebSocket, WsClient>();
const dashboards = new Map<WebSocket, WsClient>();

export function getWsCounts(): { headsetClients: number; dashboardClients: number } {
  return { headsetClients: headsets.size, dashboardClients: dashboards.size };
}

export function listConnectedHeadsetIds(): string[] {
  return Array.from(headsets.values())
    .map((c) => c.headsetId)
    .filter((id): id is string => Boolean(id));
}

export function broadcastToDashboards(msg: ServerToDashboardMsg): void {
  const data = JSON.stringify({ ...msg, ts: Date.now() });
  for (const client of dashboards.values()) {
    if (client.socket.readyState === client.socket.OPEN) client.socket.send(data);
  }
}

export function sendToHeadset(headsetId: string, msg: ServerToHeadsetMsg): boolean {
  for (const client of headsets.values()) {
    if (client.headsetId === headsetId && client.socket.readyState === client.socket.OPEN) {
      client.socket.send(JSON.stringify({ ...msg, ts: Date.now() }));
      return true;
    }
  }
  return false;
}

export function broadcastToHeadsets(msg: ServerToHeadsetMsg): void {
  const data = JSON.stringify({ ...msg, ts: Date.now() });
  for (const client of headsets.values()) {
    if (client.socket.readyState === client.socket.OPEN) client.socket.send(data);
  }
}

function authenticate(req: IncomingMessage): { user: JwtPayload; role: WsRole } | null {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const role = (url.searchParams.get("role") as WsRole | null) ?? "dashboard";
  if (role !== "headset" && role !== "dashboard") return null;

  // Headsets pass JWT via Authorization header or ?token= query.
  // Dashboards typically pass a session cookie.
  let token = url.searchParams.get("token");
  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) token = auth.slice("Bearer ".length);
  }
  if (!token) {
    const cookieHeader = req.headers.cookie ?? "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${env.COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) token = decodeURIComponent(match[1]);
  }
  if (!token) return null;

  const user = verifyToken(token);
  if (!user) return null;

  // Headset role requires kind=headset, dashboard role requires kind=user.
  if (role === "headset" && user.kind !== "headset") return null;
  if (role === "dashboard" && user.kind !== "user") return null;

  return { user, role };
}

export function attachWsServer(app: FastifyInstance): void {
  const wss = new WebSocketServer({ noServer: true, path: WS_PATH });

  app.server.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith(WS_PATH)) return;
    const auth = authenticate(req);
    if (!auth) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, auth);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage, auth: { user: JwtPayload; role: WsRole }) => {
    const client: WsClient = { socket: ws, role: auth.role, user: auth.user };

    if (auth.role === "headset") {
      // For headsets the JwtPayload.sub is the headset id.
      client.headsetId = auth.user.sub;
      headsets.set(ws, client);
      app.log.info({ headsetId: client.headsetId }, "headset connected");
    } else {
      dashboards.set(ws, client);
      app.log.info({ user: auth.user.email }, "dashboard connected");
    }

    ws.on("message", async (raw) => {
      let msg: AnyWsMessage;
      try {
        msg = JSON.parse(raw.toString()) as AnyWsMessage;
      } catch {
        return;
      }
      if (client.role === "headset") {
        await handleHeadsetMessage(client, msg, app.log);
      }
      // Dashboards are read-only over WS in Phase 1 (mutations go via REST).
    });

    ws.on("close", () => {
      if (headsets.delete(ws)) {
        app.log.info({ headsetId: client.headsetId }, "headset disconnected");
      } else {
        dashboards.delete(ws);
      }
    });

    ws.on("error", (err) => {
      app.log.error({ err }, "ws error");
    });
  });
}
