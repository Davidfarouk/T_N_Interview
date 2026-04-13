export const customerSchema = {
  type: 'object',
  properties: {
    id:           { type: 'number' },
    name:         { type: 'string' },
    totalVisits:  { type: 'number' },
    treesPlanted: { type: 'number' },
    lastSeenAt:   { type: 'string', nullable: true },
    createdAt:    { type: 'string' },
  },
};
