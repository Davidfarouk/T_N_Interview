import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import http from 'http';
import path from 'path';
import { registerSwagger } from './plugins/swagger';
import { visitRoutes } from './routes/visit.routes';
import { customerRoutes } from './routes/customer.routes';
import { statsRoutes } from './routes/stats.routes';
import { configRoutes } from './routes/config.routes';

export async function buildApp(logger = true): Promise<FastifyInstance> {
  const fastify = Fastify({ logger });

  // Normalize all errors — both thrown errors and Fastify validation errors —
  // into one consistent shape: { statusCode, error, message }
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      statusCode,
      error: http.STATUS_CODES[statusCode] ?? 'Internal Server Error',
      message: error.message,
    });
  });

  await registerSwagger(fastify);

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'frontend'),
    prefix: '/',
  });

  // All API routes are versioned under /v1
  await fastify.register(visitRoutes,   { prefix: '/v1' });
  await fastify.register(customerRoutes, { prefix: '/v1' });
  await fastify.register(statsRoutes,   { prefix: '/v1' });
  await fastify.register(configRoutes,  { prefix: '/v1' });

  return fastify;
}
