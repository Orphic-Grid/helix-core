import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './modules/app.module';

const requestTracker = new Map<string, { count: number; expiresAt: number }>();
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 180;

function pruneStaleRequests() {
  const now = Date.now();
  for (const [key, entry] of requestTracker.entries()) {
    if (entry.expiresAt <= now) {
      requestTracker.delete(key);
    }
  }
}

setInterval(pruneStaleRequests, rateLimitWindowMs);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = requestTracker.get(clientIp) ?? { count: 0, expiresAt: now + rateLimitWindowMs };

    if (entry.expiresAt <= now) {
      entry.count = 0;
      entry.expiresAt = now + rateLimitWindowMs;
    }

    entry.count += 1;
    requestTracker.set(clientIp, entry);

    if (entry.count > maxRequestsPerWindow) {
      res.setHeader('Retry-After', '60');
      res.statusCode = 429;
      return res.end('Too many requests, please try again later.');
    }

    next();
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`API running at http://0.0.0.0:${port}/api/v1`);
}

bootstrap();
