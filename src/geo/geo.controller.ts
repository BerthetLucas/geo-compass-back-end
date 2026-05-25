import { Controller, Get, Param } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('/daily-ranking')
  async getDailyGlobalBrandRanking() {
    return this.geoService.getDailyGlobalBrandRanking();
  }

  @Get('/daily-response/:model')
  async getDailyResponseByModel(@Param('model') model: string) {
    return this.geoService.getDailyResponseByModel(model);
  }
}
