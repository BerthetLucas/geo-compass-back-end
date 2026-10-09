import { Injectable } from '@nestjs/common';
import { toDateString } from 'src/common/to-date-string';
import { GeoRepository } from '../geo.repository';

@Injectable()
export class GetAvailableModelsService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async execute(date: Date, userId: number): Promise<string[]> {
    return this.geoRepository.findAvailableModels(toDateString(date), userId);
  }
}
