import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { setDb } from '../db/database';
import { runMigrations } from '../db/migrations';
import { buildApp } from '../app';
import type { FastifyInstance } from 'fastify';

function makeTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

async function setup(): Promise<FastifyInstance> {
  setDb(makeTestDb());
  return buildApp(false);
}

// ─── POST /customers ──────────────────────────────────────────────────────────

describe('POST /customers', () => {
  let app: FastifyInstance;

  beforeEach(async () => { app = await setup(); });
  afterEach(async () => { await app.close(); });

  it('creates a customer and returns 201 with full customer shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: { name: 'Alice' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      name:         'Alice',
      totalVisits:  0,
      treesPlanted: 0,
      lastSeenAt:   null,
    });
    expect(res.json().id).toBeDefined();
    expect(res.json().createdAt).toBeDefined();
  });

  it('rejects an empty name with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ statusCode: 400, error: 'Bad Request' });
  });

  it('rejects a missing name with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ statusCode: 400, error: 'Bad Request' });
  });
});

// ─── GET /customers ───────────────────────────────────────────────────────────

describe('GET /customers', () => {
  let app: FastifyInstance;

  beforeEach(async () => { app = await setup(); });
  afterEach(async () => { await app.close(); });

  it('returns an empty array when no customers exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/customers' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns all created customers with consistent shape', async () => {
    await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Alice' } });
    await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Bob' } });

    const res = await app.inject({ method: 'GET', url: '/v1/customers' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
    // Every item must have the full customer shape
    res.json().forEach((c: object) => {
      expect(c).toMatchObject({ totalVisits: 0, treesPlanted: 0 });
      expect(c).toHaveProperty('createdAt');
      expect(c).toHaveProperty('lastSeenAt');
    });
  });
});

// ─── GET /customers/:id ───────────────────────────────────────────────────────

describe('GET /customers/:id', () => {
  let app: FastifyInstance;

  beforeEach(async () => { app = await setup(); });
  afterEach(async () => { await app.close(); });

  it('returns the customer with full shape including createdAt', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Alice' } })).json();

    const res = await app.inject({ method: 'GET', url: `/v1/customers/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id, name: 'Alice', totalVisits: 0, treesPlanted: 0 });
    expect(res.json().createdAt).toBeDefined();
  });

  it('returns 404 with standard error shape for unknown customer', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/customers/999' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ statusCode: 404, error: 'Not Found', message: 'Customer not found' });
  });
});

// ─── POST /visits ─────────────────────────────────────────────────────────────

describe('POST /visits', () => {
  let app: FastifyInstance;

  beforeEach(async () => { app = await setup(); });
  afterEach(async () => { await app.close(); });

  it('returns 404 with standard error shape when customer does not exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/visits',
      payload: { customerId: 999 },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ statusCode: 404, error: 'Not Found', message: 'Customer not found' });
  });

  it('records a visit and returns correct totals without success field', async () => {
    const { id } = (await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: { name: 'Alice' },
    })).json();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/visits',
      payload: { customerId: id },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ totalVisits: 1, treePlanted: false });
    // success field must be gone
    expect(res.json().success).toBeUndefined();
  });

  it('rejects a missing customerId with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/visits',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ statusCode: 400, error: 'Bad Request' });
  });

  it('does not plant a tree before the threshold is reached', async () => {
    const { id } = (await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: { name: 'Charlie' },
    })).json();

    for (let i = 0; i < 2; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/visits',
        payload: { customerId: id },
      });
      expect(res.json().treePlanted).toBe(false);
    }
  });

  it('plants exactly one tree at the configured threshold (3 visits)', async () => {
    const { id } = (await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: { name: 'Dana' },
    })).json();

    for (let i = 0; i < 2; i++) {
      await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });
    }

    const res = await app.inject({
      method: 'POST',
      url: '/v1/visits',
      payload: { customerId: id },
    });

    expect(res.json().treePlanted).toBe(true);
    expect(res.json().totalTrees).toBe(1);
    expect(res.json().totalVisits).toBe(3);
  });

  it('plants a second tree after 2x the threshold', async () => {
    const { id } = (await app.inject({
      method: 'POST',
      url: '/v1/customers',
      payload: { name: 'Eve' },
    })).json();

    for (let i = 0; i < 5; i++) {
      await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });
    }

    const res = await app.inject({
      method: 'POST',
      url: '/v1/visits',
      payload: { customerId: id },
    });

    expect(res.json().treePlanted).toBe(true);
    expect(res.json().totalTrees).toBe(2);
  });

  it('tracks visits independently per customer', async () => {
    const alice = (await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Alice' } })).json();
    const bob   = (await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Bob' } })).json();

    for (let i = 0; i < 3; i++) {
      await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: alice.id } });
    }
    const bobRes = await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: bob.id } });

    expect(bobRes.json().treePlanted).toBe(false);
    expect(bobRes.json().totalVisits).toBe(1);
  });
});

// ─── GET /visits ──────────────────────────────────────────────────────────────

describe('GET /visits', () => {
  let app: FastifyInstance;

  beforeEach(async () => { app = await setup(); });
  afterEach(async () => { await app.close(); });

  it('returns an empty array when no visits exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/visits' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns visits with customer name attached', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Alice' } })).json();
    await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });

    const res = await app.inject({ method: 'GET', url: '/v1/visits' });
    expect(res.statusCode).toBe(200);
    expect(res.json()[0]).toMatchObject({ customerId: id, customerName: 'Alice' });
  });

  it('returns visits in descending order', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Alice' } })).json();
    await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });
    await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });

    const visits = (await app.inject({ method: 'GET', url: '/v1/visits' })).json();
    expect(visits[0].id).toBeGreaterThan(visits[1].id);
  });
});

// ─── GET /stats/hourly ────────────────────────────────────────────────────────

describe('GET /stats/hourly', () => {
  let app: FastifyInstance;

  beforeEach(async () => { app = await setup(); });
  afterEach(async () => { await app.close(); });

  it('returns an empty array when no visits exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/stats/hourly' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('aggregates visits by hour', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/v1/customers', payload: { name: 'Alice' } })).json();
    await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });
    await app.inject({ method: 'POST', url: '/v1/visits', payload: { customerId: id } });

    const res = await app.inject({ method: 'GET', url: '/v1/stats/hourly' });
    expect(res.statusCode).toBe(200);
    const stats = res.json();
    expect(stats).toHaveLength(1);
    expect(stats[0].visits).toBe(2);
  });
});
