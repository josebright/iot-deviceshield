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
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
