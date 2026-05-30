import { Module } from '@nestjs/common';
import { GeoModule } from 'src/geo/geo.module';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { RankingRepository } from './ranking.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [GeoModule, AuthModule],
  providers: [RankingService, RankingRepository, AuthGuard],
  controllers: [RankingController],
})
export class RankingModule {}
