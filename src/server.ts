import { buildApp } from './app';
import { config } from './config/env';

async function bootstrap(): Promise<void> {
  const fastify = await buildApp();

  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
