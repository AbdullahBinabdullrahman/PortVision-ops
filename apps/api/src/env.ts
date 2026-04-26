import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().default("pv_session"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  MQTT_CLIENT_ID: z.string().default("portvision-edge"),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse(process.env);
