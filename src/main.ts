import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind the Railway proxy — trust the first hop so req.ip is the real client
  // IP and IP-keyed throttling isn't one global bucket.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    // CORS matches scheme+host+port only — path is ignored.
    origin: [
      'http://localhost:3000',
      'https://geo-compass-front-end.vercel.app',
      // Vercel preview deployments of this project. Anchored ^…$ — the
      // geo-compass-front-end- prefix is only issued to this team's project.
      /^https:\/\/geo-compass-front-end-[a-z0-9-]+\.vercel\.app$/,
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
