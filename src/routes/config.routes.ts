import { FastifyInstance } from 'fastify';
import { config } from '../config/env';

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/config', {
    schema: {
      tags: ['Config'],
      summary: 'Get service configuration',
      description: 'Returns runtime configuration values such as how many visits are required to plant one tree.',
      response: {
        200: {
          type: 'object',
          properties: {
            visitsPerTree: { type: 'number', description: 'Number of visits required to plant one tree (X)' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    return reply.send({ visitsPerTree: config.VISITS_PER_TREE });
  });
}
