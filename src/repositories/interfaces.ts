import type { Customer } from './customer.repo';
import type { HourlyVisit, RecentVisit } from './visit.repo';

export interface ICustomerRepository {
  create(name: string): Customer;
  findById(id: number): Customer | undefined;
  findAll(): (Customer & { total_visits: number })[];
  updateLastSeen(id: number): void;
  incrementTreesPlanted(id: number): void;
  getVisitCount(customerId: number): number;
  getTreesPlanted(customerId: number): number;
}

export interface IVisitRepository {
  insert(customerId: number): void;
  getRecent(limit?: number): RecentVisit[];
  getHourly(): HourlyVisit[];
}
