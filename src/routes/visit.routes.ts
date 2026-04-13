import { FastifyInstance } from 'fastify';
import { processVisit } from '../services/visit.service';
import { getRecentVisits } from '../repositories/visit.repo';
import { visitBodySchema, visitResponseSchema } from '../schemas/visit.schema';
import { errorSchema } from '../schemas/error.schema';

export async function visitRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/visits', {
    schema: {
      tags: ['Visits'],
      summary: 'List recent visits',
      description: 'Returns the most recent visit records with customer info.',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:           { type: 'number' },
              customerId:   { type: 'number' },
              customerName: { type: 'string' },
              visitedAt:    { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    // limit is always defined — schema default applies when param is absent
    const { limit } = request.query as { limit: number };
    return reply.send(getRecentVisits(limit).map(v => ({
      id:           v.id,
      customerId:   v.customer_id,
      customerName: v.customer_name,
      visitedAt:    v.visited_at,
    })));
  });

  fastify.post('/visits', {
    schema: {
      tags: ['Visits'],
      summary: 'Register a customer visit',
      description: 'Records a shop visit and plants a tree every X visits.',
      body:     visitBodySchema,
      response: { 200: visitResponseSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const { customerId } = request.body as { customerId: number };
    return reply.send(processVisit(customerId));
  });
}
