import { FastifyInstance } from 'fastify';
import { CustomerService } from '../services/customer.service';
import { customerSchema } from '../schemas/customer.schema';
import { errorSchema } from '../schemas/error.schema';

export async function customerRoutes(
  fastify: FastifyInstance,
  opts: { customerService: CustomerService },
): Promise<void> {
  const { customerService } = opts;

  fastify.post('/customers', {
    schema: {
      tags: ['Customers'],
      summary: 'Create a new customer',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      response: { 201: customerSchema },
    },
  }, async (request, reply) => {
    const { name } = request.body as { name: string };
    return reply.status(201).send(customerService.create(name));
  });

  fastify.get('/customers', {
    schema: {
      tags: ['Customers'],
      summary: 'List all customers',
      response: { 200: { type: 'array', items: customerSchema } },
    },
  }, async (_request, reply) => {
    return reply.send(customerService.list());
  });

  fastify.get('/customers/:id', {
    schema: {
      tags: ['Customers'],
      summary: 'Get a customer by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
      response: { 200: customerSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    return reply.send(customerService.getById(id));
  });
}
