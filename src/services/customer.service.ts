import { NotFoundError } from '../errors/domain';
import type { ICustomerRepository } from '../repositories/interfaces';

export interface CustomerView {
  id: number;
  name: string;
  totalVisits: number;
  treesPlanted: number;
  lastSeenAt: string | null;
  createdAt: string;
}

export class CustomerService {
  constructor(private customerRepo: ICustomerRepository) {}

  create(name: string): CustomerView {
    const customer = this.customerRepo.create(name);
    return {
      id:           customer.id,
      name:         customer.name,
      totalVisits:  0,
      treesPlanted: 0,
      lastSeenAt:   null,
      createdAt:    customer.created_at,
    };
  }

  list(): CustomerView[] {
    return this.customerRepo.findAll().map(c => ({
      id:           c.id,
      name:         c.name,
      totalVisits:  c.total_visits,
      treesPlanted: c.trees_planted,
      lastSeenAt:   c.last_seen_at,
      createdAt:    c.created_at,
    }));
  }

  getById(id: number): CustomerView {
    const customer = this.customerRepo.findById(id);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return {
      id:           customer.id,
      name:         customer.name,
      totalVisits:  this.customerRepo.getVisitCount(id),
      treesPlanted: customer.trees_planted,
      lastSeenAt:   customer.last_seen_at,
      createdAt:    customer.created_at,
    };
  }
}
