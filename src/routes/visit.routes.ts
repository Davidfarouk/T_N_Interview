import { FastifyInstance } from 'fastify';
import { postVisitJsonSchema } from '../schemas/visit.schema';
import { processVisit } from '../services/visit.service';
import { getRecentVisits } from '../repositories/visit.repo';

export async function visitRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/visits', {
    schema: {
      tags: ['Visits'],
      summary: 'List recent visits',
      description: 'Returns the 50 most recent visit records with customer info.',
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
              id: { type: 'number' },
              customerId: { type: 'number' },
              customerName: { type: 'string' },
              visitedAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { limit } = (request.query as { limit?: number });
    const visits = getRecentVisits(limit ?? 50);
    return reply.send(visits.map(v => ({
      id: v.id,
      customerId: v.customer_id,
      customerName: v.customer_name,
      visitedAt: v.visited_at,
    })));
  });

  fastify.post('/visits', {
    schema: {
      ...postVisitJsonSchema,
      tags: ['Visits'],
      summary: 'Register a customer visit',
      description: 'Records a shop visit for an existing customer and plants a tree every X visits.',
    },
  }, async (request, reply) => {
    const { customerId } = request.body as { customerId: number };
    const result = processVisit(customerId);

    if (!result) {
      return reply.status(404).send({ message: 'Customer not found', statusCode: 404 });
    }

    return reply.send({ success: true, ...result });
  });
}
