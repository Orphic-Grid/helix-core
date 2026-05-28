import { createHash } from 'crypto';
import { hostname } from 'os';

const LOCAL_DEFAULTS = {
  JWT_SECRET: 'local-dev-change-me',
  JWT_REFRESH_SECRET: 'local-dev-refresh-secret',
};

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return null;
}

export function secretEnv(name: keyof typeof LOCAL_DEFAULTS) {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (isProduction()) {
    if (name === 'JWT_REFRESH_SECRET') {
      return secretEnv('JWT_SECRET');
    }

    const seed = [
      process.env.DATABASE_URL,
      process.env.RENDER_SERVICE_ID,
      process.env.RENDER_EXTERNAL_HOSTNAME,
      hostname(),
      name,
      'helix-core-production-fallback',
    ].filter(Boolean).join(':');

    return createHash('sha256').update(seed).digest('hex');
  }

  return LOCAL_DEFAULTS[name];
}

export function internalServiceUrl(urlKey: string, hostPortKey: string) {
  const url = process.env[urlKey];
  if (url) {
    return url.replace(/\/$/, '');
  }

  const hostPort = process.env[hostPortKey];
  if (hostPort) {
    return `http://${hostPort}`;
  }

  return null;
}
