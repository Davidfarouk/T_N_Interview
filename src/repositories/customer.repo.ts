import { getDb } from '../db/database';

export interface Customer {
  id: number;
  name: string;
  trees_planted: number;
  last_seen_at: string | null;
  created_at: string;
}

export function createCustomer(name: string): Customer {
  const db = getDb();
  const result = db.prepare('INSERT INTO customers (name) VALUES (?)').run(name);
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as Customer;
}

export function findCustomerById(id: number): Customer | undefined {
  return getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined;
}

export function getAllCustomers(): (Customer & { total_visits: number })[] {
  return getDb().prepare(`
    SELECT c.*, COUNT(v.id) as total_visits
    FROM customers c
    LEFT JOIN visits v ON v.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.last_seen_at DESC
  `).all() as (Customer & { total_visits: number })[];
}

export function updateLastSeen(id: number): void {
  getDb().prepare('UPDATE customers SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
}

export function incrementTreesPlanted(id: number): void {
  getDb().prepare('UPDATE customers SET trees_planted = trees_planted + 1 WHERE id = ?').run(id);
}

export function getVisitCount(customerId: number): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) as count FROM visits WHERE customer_id = ?')
    .get(customerId) as { count: number };
  return row.count;
}

export function getTreesPlanted(customerId: number): number {
  const row = getDb()
    .prepare('SELECT trees_planted FROM customers WHERE id = ?')
    .get(customerId) as { trees_planted: number };
  return row.trees_planted;
}
