import { FastifyInstance } from 'fastify';
import { getHourlyVisits } from '../repositories/visit.repo';

export async function statsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/stats/hourly', {
    schema: {
      tags: ['Stats'],
      summary: 'Hourly visit aggregation',
      description: 'Returns visits grouped by hour.',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hour: { type: 'string' },
              visits: { type: 'number' },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    return reply.send(getHourlyVisits());
  });
}
