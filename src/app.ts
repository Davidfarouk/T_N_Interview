import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { registerSwagger } from './plugins/swagger';
import { visitRoutes } from './routes/visit.routes';
import { customerRoutes } from './routes/customer.routes';
import { statsRoutes } from './routes/stats.routes';
import { configRoutes } from './routes/config.routes';

export async function buildApp(logger = true): Promise<FastifyInstance> {
  const fastify = Fastify({ logger });

  await registerSwagger(fastify);

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'frontend'),
    prefix: '/',
  });

  await fastify.register(visitRoutes);
  await fastify.register(customerRoutes);
  await fastify.register(statsRoutes);
  await fastify.register(configRoutes);

  return fastify;
}
