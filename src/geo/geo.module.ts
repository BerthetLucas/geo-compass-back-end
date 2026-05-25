import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GeoRepository } from './geo.repository';

@Module({
  providers: [GeoService, GeoRepository],
  controllers: [GeoController],
  exports: [GeoRepository],
})
export class GeoModule {}
