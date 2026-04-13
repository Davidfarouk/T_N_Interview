import { config } from '../config/env';
import { withTransaction } from '../db/database';
import {
  findCustomerById,
  updateLastSeen,
  incrementTreesPlanted,
  getVisitCount,
  getTreesPlanted,
} from '../repositories/customer.repo';
import { insertVisit } from '../repositories/visit.repo';

export interface VisitResult {
  treePlanted: boolean;
  totalVisits: number;
  totalTrees: number;
  visitsUntilNextTree: number;
}

export function processVisit(customerId: number): VisitResult {
  const customer = findCustomerById(customerId);

  if (!customer) {
    throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  }

  return withTransaction((): VisitResult => {
    updateLastSeen(customerId);
    insertVisit(customerId);

    const totalVisits = getVisitCount(customerId);
    const treePlanted = totalVisits % config.VISITS_PER_TREE === 0;

    if (treePlanted) incrementTreesPlanted(customerId);

    return {
      treePlanted,
      totalVisits,
      totalTrees:          getTreesPlanted(customerId),
      visitsUntilNextTree: config.VISITS_PER_TREE - (totalVisits % config.VISITS_PER_TREE),
    };
  });
}
