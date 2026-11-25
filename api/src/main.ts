import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Some shells export PORT=0; treat anything not a positive integer as "use 3000".
  const configuredPort = Number.parseInt(process.env.PORT ?? '', 10);
  const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3000;

  await app.listen(port, '127.0.0.1');
}

await bootstrap();
