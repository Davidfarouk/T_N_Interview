import { config } from '../config/env';
import { NotFoundError } from '../errors/domain';
import type { ICustomerRepository, IVisitRepository } from '../repositories/interfaces';
import type { RecentVisit } from '../repositories/visit.repo';

export interface VisitResult {
  treePlanted: boolean;
  totalVisits: number;
  totalTrees: number;
  visitsUntilNextTree: number;
}

type TransactionRunner = <T>(fn: () => T) => T;

export class VisitService {
  constructor(
    private customerRepo: ICustomerRepository,
    private visitRepo: IVisitRepository,
    private runInTransaction: TransactionRunner,
  ) {}

  processVisit(customerId: number): VisitResult {
    const customer = this.customerRepo.findById(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return this.runInTransaction((): VisitResult => {
      this.customerRepo.updateLastSeen(customerId);
      this.visitRepo.insert(customerId);

      const totalVisits = this.customerRepo.getVisitCount(customerId);
      const treePlanted = totalVisits % config.VISITS_PER_TREE === 0;

      if (treePlanted) this.customerRepo.incrementTreesPlanted(customerId);

      return {
        treePlanted,
        totalVisits,
        totalTrees:          this.customerRepo.getTreesPlanted(customerId),
        visitsUntilNextTree: config.VISITS_PER_TREE - (totalVisits % config.VISITS_PER_TREE),
      };
    });
  }

  listRecent(limit: number): RecentVisit[] {
    return this.visitRepo.getRecent(limit);
  }
}
