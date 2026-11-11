import 'dotenv/config';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter, { apiErrorHandler } from './routes/api.js';
import { prisma } from './utils/prisma.js';

const app = express();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(projectRoot, 'public');
const production = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const databaseUrl = process.env.DATABASE_URL;

app.disable('x-powered-by');
if (production) app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
    }
  }
}));

if (process.env.ALLOWED_ORIGIN) {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true
  }));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

if (sessionSecret && sessionSecret.length < 64) {
  throw new Error('SESSION_SECRET must be at least 64 characters. Generate one with npm run secret:generate.');
}

if (production && (!sessionSecret || !databaseUrl)) {
  throw new Error('SESSION_SECRET and DATABASE_URL are required in production.');
}

app.get('/api/v1/health', (_request, response) => {
  response.json({
    success: true,
    data: { status: 'ok' }
  });
});

if (sessionSecret && databaseUrl) {
  app.use(session({
    store: new PrismaSessionStore(prisma, {
      dbRecordIdIsSessionId: true,
      sessionModelName: 'session'
    }),
    secret: sessionSecret,
    name: 'cf_session',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      path: '/api',
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000
    }
  }));
}

app.use('/api/v1', apiRouter);
app.use(express.static(publicDirectory));

app.use('/api', (_request, response) => {
  response.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint was not found.'
    }
  });
});

app.use((request, response) => {
  if (request.accepts('html')) {
    return response.status(404).sendFile(path.join(publicDirectory, 'index.html'));
  }

  response.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
});

app.use(apiErrorHandler);

export default app;
