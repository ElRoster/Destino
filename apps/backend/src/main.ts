import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security headers using Helmet
  app.use(helmet());

  // Enable CORS securely
  const clientUrl = configService.get<string>('CLIENT_URL', 'http://localhost:5173');
  app.enableCors({
    origin: [clientUrl, 'http://localhost:3000'], // Allow web dashboard & local dev
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global DTO input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global standard exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Listen port
  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`Tarot Backend successfully started on port ${port}`);
}
bootstrap();
