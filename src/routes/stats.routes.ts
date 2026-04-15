import { FastifyInstance } from 'fastify';
import { StatsService } from '../services/stats.service';

export async function statsRoutes(
  fastify: FastifyInstance,
  opts: { statsService: StatsService },
): Promise<void> {
  const { statsService } = opts;

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
    return reply.send(statsService.getHourly());
  });
}
