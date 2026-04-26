import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@portvision/shared"],
  // standalone output bundles a tiny self-contained server for Docker.
  output: "standalone",
  experimental: {
    typedRoutes: false,
    // Tell Next where the monorepo root is so workspace deps get traced.
    // (Promoted to top-level in Next 15; under `experimental` for Next 14.)
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

export default withNextIntl(nextConfig);
