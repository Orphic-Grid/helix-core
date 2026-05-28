import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async rewrites() {
    const apiOrigin = process.env.API_INTERNAL_URL ?? (
      process.env.API_INTERNAL_HOSTPORT ? `http://${process.env.API_INTERNAL_HOSTPORT}` : null
    );

    if (!apiOrigin) {
      return [];
    }

    return [{
      source: '/api/v1/:path*',
      destination: `${apiOrigin.replace(/\/$/, '')}/api/v1/:path*`,
    }];
  },
};

export default nextConfig;
