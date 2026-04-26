import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";

import { env } from "./env.js";
import { attachUser } from "./auth/middleware.js";
import { authRoutes } from "./auth/routes.js";
import { containerRoutes } from "./routes/containers.js";
import { operatorRoutes } from "./routes/operators.js";
import { headsetRoutes } from "./routes/headsets.js";
import { sensorRoutes } from "./routes/sensors.js";
import { actionRoutes } from "./routes/actions.js";
import { alertRoutes } from "./routes/alerts.js";
import { auditRoutes } from "./routes/audit.js";
import { opsRoutes } from "./routes/ops.js";
import { attachWsServer } from "./ws/server.js";
import { startMqttIngest } from "./mqtt/ingest.js";
import { registerAuditMiddleware } from "./plugins/audit.js";

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
      level: env.NODE_ENV === "development" ? "info" : "warn",
    },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(sensible);

  app.addHook("preHandler", attachUser);

  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(containerRoutes);
      await api.register(operatorRoutes);
      await api.register(headsetRoutes);
      await api.register(sensorRoutes);
      await api.register(actionRoutes);
      await api.register(alertRoutes);
      await api.register(auditRoutes);
      await api.register(opsRoutes);
    },
    { prefix: "/api/v1" }
  );

  app.get("/", async () => ({ name: "portvision-api", version: "0.1.0" }));

  registerAuditMiddleware();

  await app.listen({ port: env.API_PORT, host: env.API_HOST });

  attachWsServer(app);
  startMqttIngest(app.log);

  app.log.info(
    `🛰  PortVision API ready on http://${env.API_HOST}:${env.API_PORT} (ws path: /ws)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
