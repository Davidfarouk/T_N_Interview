import { getDb } from '../db/database';

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

export function insertVisit(customerId: number): void {
  getDb().prepare('INSERT INTO visits (customer_id) VALUES (?)').run(customerId);
}

export function getRecentVisits(limit = 50): RecentVisit[] {
  return getDb().prepare(`
    SELECT v.id, v.customer_id, c.name AS customer_name, v.visited_at
    FROM visits v
    JOIN customers c ON c.id = v.customer_id
    ORDER BY v.visited_at DESC, v.id DESC
    LIMIT ?
  `).all(limit) as RecentVisit[];
}

export function getHourlyVisits(): HourlyVisit[] {
  return getDb().prepare(`
    SELECT
      strftime('%Y-%m-%d %H:00', visited_at) AS hour,
      COUNT(*) AS visits
    FROM visits
    GROUP BY hour
    ORDER BY hour DESC
  `).all() as HourlyVisit[];
}
