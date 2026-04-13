import { errorSchema } from './error.schema';

export const visitBodySchema = {
  type: 'object',
  required: ['customerId'],
  properties: {
    customerId: { type: 'integer', minimum: 1 },
  },
};

export const visitResponseSchema = {
  type: 'object',
  properties: {
    treePlanted:         { type: 'boolean' },
    totalVisits:         { type: 'number' },
    totalTrees:          { type: 'number' },
    visitsUntilNextTree: { type: 'number' },
  },
};

export { errorSchema };
