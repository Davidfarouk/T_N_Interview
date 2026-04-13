export const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    error:      { type: 'string' },
    message:    { type: 'string' },
  },
};
