"use client";

import { useEffect, useRef, useState } from "react";
import type { ServerToDashboardMsg } from "@portvision/shared/ws-protocol";
import { WS_URL } from "./env";

interface UseDashboardSocketOptions {
  onMessage?: (msg: ServerToDashboardMsg) => void;
}

export function useDashboardSocket({ onMessage }: UseDashboardSocketOptions = {}) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    async function open() {
      if (stopped) return;
      let token = "";
      try {
        const res = await fetch("/api/auth/ws-token", { cache: "no-store" });
        if (res.ok) {
          const j = (await res.json()) as { token?: string };
          token = j.token ?? "";
        }
      } catch {
        // ignore — will reconnect
      }
      if (stopped) return;
      const url = `${WS_URL}?role=dashboard${token ? `&token=${encodeURIComponent(token)}` : ""}`;
      socket = new WebSocket(url);
      socket.addEventListener("open", () => setConnected(true));
      socket.addEventListener("close", () => {
        setConnected(false);
        if (!stopped) reconnectTimer = setTimeout(open, 2000);
      });
      socket.addEventListener("message", (e) => {
        try {
          const msg = JSON.parse((e as MessageEvent).data as string) as ServerToDashboardMsg;
          onMessageRef.current?.(msg);
        } catch {
          // ignore
        }
      });
    }

    open();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return { connected };
}
