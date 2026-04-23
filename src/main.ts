import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: true,
  });

  // start security
  // // CSRF protection
  // const {
  //   doubleCsrfProtection, // This is the default CSRF protection middleware.
  // } = doubleCsrf({
  //   secret: process.env.CSRF_SECRET,
  //   cookie: {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'strict',
  //   },

  //   });
  // app.use(doubleCsrfProtection);

  // helmet HTTP headers
  app.use(helmet());
  // Cors
  app.enableCors({
    origin: ['https://ecommerce-nestjs.com'],
  });
  // end security

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
