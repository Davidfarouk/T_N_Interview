export const postVisitJsonSchema = {
  body: {
    type: 'object',
    required: ['customerId'],
    properties: {
      customerId: { type: 'integer', minimum: 1 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        treePlanted:          { type: 'boolean' },
        totalVisits:          { type: 'number' },
        totalTrees:           { type: 'number' },
        visitsUntilNextTree:  { type: 'number' },
      },
    },
    404: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error:      { type: 'string' },
        message:    { type: 'string' },
      },
    },
  },
};
