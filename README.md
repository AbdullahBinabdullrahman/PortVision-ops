# PortVision — Ops

Edge server (API), Operations Center (web dashboard), and traffic simulator for the
PortVision AR-powered smart-port container inspection system.

> Phase 1 of the roadmap: PostgreSQL schema, Node.js edge server, REST + WebSocket
> APIs, MQTT broker, and the operations center for monitoring employees, headsets,
> sensors/IoT, 5G connectivity, and alerts.

## Layout

```
apps/
  api/    Fastify edge server (REST + WebSocket + MQTT ingest)
  web/    Next.js 14 dashboard
  sim/    Headset + sensor simulator (so the system is demo-able without hardware)
packages/
  shared/ Types, WS protocol, MQTT topics — shared by all apps
docker/   mosquitto.conf
```

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Bring up Postgres + Mosquitto
cp .env.example .env
pnpm db:up

# 3. Migrate + seed
pnpm db:migrate
pnpm db:seed

# 4. Run API + Web in parallel
pnpm dev

# 5. (Separate terminal) Spawn simulated headsets + sensors
pnpm sim:start
```

Open <http://localhost:3000> and sign in as `admin@portvision.local` / `portvision`.

The API listens on <http://localhost:4000>; WebSocket on `ws://localhost:4000/ws`.
