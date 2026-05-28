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

export function secretEnv(name: keyof typeof LOCAL_DEFAULTS) {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (isProduction()) {
    throw new Error(`${name} is required in production`);
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
