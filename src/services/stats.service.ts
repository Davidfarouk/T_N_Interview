import type { IVisitRepository } from '../repositories/interfaces';
import type { HourlyVisit } from '../repositories/visit.repo';

export class StatsService {
  constructor(private visitRepo: IVisitRepository) {}

  getHourly(): HourlyVisit[] {
    return this.visitRepo.getHourly();
  }
}
