import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GeoRepository } from './geo.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [GeoService, GeoRepository, AuthGuard],
  controllers: [GeoController],
  exports: [GeoRepository],
})
export class GeoModule {}
