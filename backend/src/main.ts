import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function configuredCorsOrigins() {
  return (process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) {
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowedOrigins = configuredCorsOrigins();

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  if (process.env.NODE_ENV !== 'production' && isLocalOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
}

function securityHeaders(_request, response, next) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  next();
}

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && configuredCorsOrigins().length === 0) {
    throw new Error('FRONTEND_ORIGIN is required in production.');
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.use(securityHeaders);
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
