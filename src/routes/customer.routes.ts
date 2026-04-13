import { FastifyInstance } from 'fastify';
import { createCustomer, findCustomerById, getVisitCount, getAllCustomers } from '../repositories/customer.repo';

export async function customerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/customers', {
    schema: {
      tags: ['Customers'],
      summary: 'Create a new customer',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { name } = request.body as { name: string };
    const customer = createCustomer(name);
    return reply.status(201).send({ id: customer.id, name: customer.name, createdAt: customer.created_at });
  });

  fastify.get('/customers', {
    schema: {
      tags: ['Customers'],
      summary: 'List all customers',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              totalVisits: { type: 'number' },
              treesPlanted: { type: 'number' },
              lastSeenAt: { type: 'string', nullable: true },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    const customers = getAllCustomers();
    return reply.send(customers.map(c => ({
      id: c.id,
      name: c.name,
      totalVisits: c.total_visits,
      treesPlanted: c.trees_planted,
      lastSeenAt: c.last_seen_at,
      createdAt: c.created_at,
    })));
  });

  fastify.get('/customers/:id', {
    schema: {
      tags: ['Customers'],
      summary: 'Get a customer by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            totalVisits: { type: 'number' },
            treesPlanted: { type: 'number' },
            lastSeenAt: { type: 'string', nullable: true },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const customer = findCustomerById(id);

    if (!customer) {
      return reply.status(404).send({ message: 'Customer not found', statusCode: 404 });
    }

    return reply.send({
      id: customer.id,
      name: customer.name,
      totalVisits: getVisitCount(id),
      treesPlanted: customer.trees_planted,
      lastSeenAt: customer.last_seen_at,
    });
  });
}
