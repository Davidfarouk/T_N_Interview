import Database from 'better-sqlite3';
import type { ICustomerRepository } from './interfaces';

export interface Customer {
  id: number;
  name: string;
  trees_planted: number;
  last_seen_at: string | null;
  created_at: string;
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private db: Database.Database) {}

  create(name: string): Customer {
    const { lastInsertRowid } = this.db.prepare('INSERT INTO customers (name) VALUES (?)').run(name);
    return this.db
      .prepare('SELECT id, name, trees_planted, last_seen_at, created_at FROM customers WHERE id = ?')
      .get(lastInsertRowid) as Customer;
  }

  findById(id: number): Customer | undefined {
    return this.db
      .prepare('SELECT id, name, trees_planted, last_seen_at, created_at FROM customers WHERE id = ?')
      .get(id) as Customer | undefined;
  }

  findAll(): (Customer & { total_visits: number })[] {
    return this.db.prepare(`
      SELECT c.id, c.name, c.trees_planted, c.last_seen_at, c.created_at,
             COUNT(v.id) AS total_visits
      FROM customers c
      LEFT JOIN visits v ON v.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.last_seen_at DESC
    `).all() as (Customer & { total_visits: number })[];
  }

  updateLastSeen(id: number): void {
    this.db.prepare('UPDATE customers SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }

  incrementTreesPlanted(id: number): void {
    this.db.prepare('UPDATE customers SET trees_planted = trees_planted + 1 WHERE id = ?').run(id);
  }

  getVisitCount(customerId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS count FROM visits WHERE customer_id = ?')
      .get(customerId) as { count: number };
    return row.count;
  }

  getTreesPlanted(customerId: number): number {
    const row = this.db
      .prepare('SELECT trees_planted FROM customers WHERE id = ?')
      .get(customerId) as { trees_planted: number };
    return row.trees_planted;
  }
}
