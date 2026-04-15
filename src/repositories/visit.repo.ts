import Database from 'better-sqlite3';
import type { IVisitRepository } from './interfaces';

export interface HourlyVisit {
  hour: string;
  visits: number;
}

export interface RecentVisit {
  id: number;
  customer_id: number;
  customer_name: string;
  visited_at: string;
}

export class VisitRepository implements IVisitRepository {
  constructor(private db: Database.Database) {}

  insert(customerId: number): void {
    this.db.prepare('INSERT INTO visits (customer_id) VALUES (?)').run(customerId);
  }

  getRecent(limit = 50): RecentVisit[] {
    return this.db.prepare(`
      SELECT v.id, v.customer_id, c.name AS customer_name, v.visited_at
      FROM visits v
      JOIN customers c ON c.id = v.customer_id
      ORDER BY v.visited_at DESC, v.id DESC
      LIMIT ?
    `).all(limit) as RecentVisit[];
  }

  getHourly(): HourlyVisit[] {
    return this.db.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00', visited_at) AS hour,
        COUNT(*) AS visits
      FROM visits
      GROUP BY hour
      ORDER BY hour DESC
    `).all() as HourlyVisit[];
  }
}
