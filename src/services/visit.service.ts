import { config } from '../config/env';
import { findCustomerById, updateLastSeen, incrementTreesPlanted, getVisitCount, getTreesPlanted } from '../repositories/customer.repo';
import { insertVisit } from '../repositories/visit.repo';
import { getDb } from '../db/database'; // used only for the transaction wrapper

export interface VisitResult {
  treePlanted: boolean;
  totalVisits: number;
  totalTrees: number;
  visitsUntilNextTree: number;
}

export function processVisit(customerId: number): VisitResult | null {
  const customer = findCustomerById(customerId);
  if (!customer) return null;

  const db = getDb();

  const process = db.transaction((): VisitResult => {
    updateLastSeen(customerId);
    insertVisit(customerId);

    const totalVisits = getVisitCount(customerId);
    const treePlanted = totalVisits % config.VISITS_PER_TREE === 0;

    if (treePlanted) incrementTreesPlanted(customerId);

    return {
      treePlanted,
      totalVisits,
      totalTrees: getTreesPlanted(customerId),
      visitsUntilNextTree: config.VISITS_PER_TREE - (totalVisits % config.VISITS_PER_TREE),
    };
  });

  return process();
}
