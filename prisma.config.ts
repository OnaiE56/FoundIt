import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations-sqlite',
    seed: 'node prisma/seed.js'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
});
