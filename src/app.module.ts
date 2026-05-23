import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './llm/llm.module';
import { GeoModule } from './geo/geo.module';
import { ConfigModule } from '@nestjs/config';
import { LlmController } from './llm/llm.controller';
import { LlmService } from './llm/llm.service';
import { HttpModule } from '@nestjs/axios';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    LlmModule,
    GeoModule,
    HttpModule,
  ],
  controllers: [AppController, LlmController],
  providers: [AppService, LlmService],
})
export class AppModule {}
