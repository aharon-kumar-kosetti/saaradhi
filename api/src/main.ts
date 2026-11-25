import { NestFactory } from '@nestjs/core';
import { json } from 'express';

import { AppModule } from './app.module.js';

async function bootstrap() {
  // Notices arrive inline as base64, so the default 100 kB parser limit is too small.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '12mb' }));

  // Some shells export PORT=0; treat anything not a positive integer as "use 3000".
  const configuredPort = Number.parseInt(process.env.PORT ?? '', 10);
  const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3000;

  await app.listen(port, '127.0.0.1');
}

await bootstrap();
