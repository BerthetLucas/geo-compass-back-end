import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://geo-compass-front-end.vercel.app',
      'https://geo-compass-front-end.vercel.app/en/login',
      'https://geo-compass-front-end.vercel.app/fr/login',
      'https://geo-compass-front-end.vercel.app/en/register',
      'https://geo-compass-front-end.vercel.app/fr/register',
    ],
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
