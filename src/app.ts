import Fastify, { FastifyError, FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import Database from 'better-sqlite3';
import http from 'http';
import path from 'path';
import { registerSwagger } from './plugins/swagger';
import { visitRoutes } from './routes/visit.routes';
import { customerRoutes } from './routes/customer.routes';
import { statsRoutes } from './routes/stats.routes';
import { configRoutes } from './routes/config.routes';
import { NotFoundError } from './errors/domain';
import { CustomerRepository } from './repositories/customer.repo';
import { VisitRepository } from './repositories/visit.repo';
import { CustomerService } from './services/customer.service';
import { VisitService } from './services/visit.service';
import { StatsService } from './services/stats.service';
import { getDb } from './db/database';

export async function buildApp(logger = true, overrideDb?: Database.Database): Promise<FastifyInstance> {
  const fastify = Fastify({ logger });

  const db = overrideDb ?? getDb();
  const runInTransaction = <T>(fn: () => T): T => db.transaction(fn)();

  const customerRepo = new CustomerRepository(db);
  const visitRepo    = new VisitRepository(db);

  const customerService = new CustomerService(customerRepo);
  const visitService    = new VisitService(customerRepo, visitRepo, runInTransaction);
  const statsService    = new StatsService(visitRepo);

  // Normalize all errors — domain errors, thrown errors, and Fastify validation errors —
  // into one consistent shape: { statusCode, error, message }
  fastify.setErrorHandler((error: Error, _request, reply) => {
    let statusCode: number;
    if (error instanceof NotFoundError) {
      statusCode = 404;
    } else {
      statusCode = (error as FastifyError).statusCode ?? 500;
    }
    reply.status(statusCode).send({
      statusCode,
      error: http.STATUS_CODES[statusCode] ?? 'Internal Server Error',
      message: error.message,
    });
  });

  await registerSwagger(fastify);

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'frontend'),
    prefix: '/',
  });

  // All API routes are versioned under /v1
  await fastify.register(visitRoutes,    { prefix: '/v1', visitService });
  await fastify.register(customerRoutes, { prefix: '/v1', customerService });
  await fastify.register(statsRoutes,    { prefix: '/v1', statsService });
  await fastify.register(configRoutes,   { prefix: '/v1' });

  return fastify;
}
