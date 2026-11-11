import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import test, { after } from 'node:test';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import app from '../backend/app.js';
import { prisma } from '../backend/utils/prisma.js';

const store = new PrismaSessionStore(prisma, {
  dbRecordIdIsSessionId: true,
  sessionModelName: 'session'
});

function callStore(method, ...args) {
  return new Promise((resolve, reject) => {
    store[method](...args, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

test('Prisma connects to SQLite and persists server-side sessions', async () => {
  await prisma.$connect();
  assert.equal(typeof await prisma.category.count(), 'number');

  const sid = `test-${randomUUID()}`;
  const session = {
    cookie: {
      originalMaxAge: 7_200_000,
      expires: new Date(Date.now() + 7_200_000),
      maxAge: 7_200_000
    },
    userId: 'test-user',
    csrfToken: 'test-csrf-token'
  };

  try {
    await callStore('set', sid, session);

    const stored = await callStore('get', sid);
    assert.equal(stored.userId, session.userId);
    assert.equal(stored.csrfToken, session.csrfToken);

    const record = await prisma.session.findUnique({ where: { sid } });
    assert.equal(record.id, sid);
    assert.ok(record.expiresAt > new Date());

    const touchedSession = {
      ...session,
      cookie: {
        ...session.cookie,
        expires: new Date(Date.now() + 10_800_000),
        maxAge: 10_800_000
      }
    };
    await callStore('touch', sid, touchedSession);
    const touchedRecord = await prisma.session.findUnique({ where: { sid } });
    assert.ok(touchedRecord.expiresAt > record.expiresAt);
    await callStore('destroy', sid);
    assert.equal(await callStore('get', sid), undefined);
  } finally {
    await prisma.session.deleteMany({ where: { sid } });
  }
});

test('expired server-side sessions are not returned', async () => {
  const sid = `expired-${randomUUID()}`;
  await prisma.session.create({
    data: {
      id: sid,
      sid,
      data: JSON.stringify({ userId: 'expired-user' }),
      expiresAt: new Date(Date.now() - 1_000)
    }
  });

  try {
    assert.equal(await callStore('get', sid), undefined);
  } finally {
    await prisma.session.deleteMany({ where: { sid } });
  }
});

test('Express starts and serves the existing health endpoint', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { status: 'ok' }
  });
});

after(async () => {
  await prisma.$disconnect();
});
