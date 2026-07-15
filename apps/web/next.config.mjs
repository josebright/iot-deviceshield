import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Trace files from the monorepo root so the standalone bundle includes
  // workspace packages (e.g. @iot-deviceshield/types).
  outputFileTracingRoot: join(__dirname, '..', '..'),
  // Skip Next's built-in ESLint step during `next build` — it hits an
  // ajv-plugin peer mismatch when we override ajv to fix a transitive CVE.
  // Linting still runs via the separate `pnpm lint` step in CI.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
