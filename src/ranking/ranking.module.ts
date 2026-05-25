import { Module } from '@nestjs/common';
import { GeoModule } from 'src/geo/geo.module';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { RankingRepository } from './ranking.repository';

@Module({
  imports: [GeoModule],
  controllers: [RankingController],
  providers: [RankingService, RankingRepository],
})
export class RankingModule {}
