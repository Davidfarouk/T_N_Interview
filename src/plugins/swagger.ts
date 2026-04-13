import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Tree Nation API',
        description: 'X Visits = 1 Tree — backend service for planting trees via shop visits',
        version: '1.0.0',
      },
      tags: [
        { name: 'Visits', description: 'Visit event endpoints' },
        { name: 'Customers', description: 'Customer data endpoints' },
        { name: 'Stats', description: 'Aggregated statistics' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
