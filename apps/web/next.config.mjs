import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  outputFileTracingRoot: join(__dirname, '..', '..'),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
