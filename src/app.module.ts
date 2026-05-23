import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './llm/llm.module';
import { GeoModule } from './geo/geo.module';

@Module({
  imports: [LlmModule, GeoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
