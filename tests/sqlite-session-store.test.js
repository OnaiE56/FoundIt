import 'dotenv/config';
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
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

test('a single report photo uploads successfully and a second photo is rejected', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const email = `upload-test-${randomUUID()}@example.test`;
  const sessionIds = new Set();
  const photoPaths = new Set();
  let cookieHeader = '';
  let csrfToken = '';

  function rememberPhoto(uploadedPhoto) {
    const filename = path.basename(uploadedPhoto.url);
    assert.match(filename, /^[a-f0-9]{32}\.png$/);
    photoPaths.add(path.resolve('public/uploads/item-photos', filename));
  }

  function updateCookies(response) {
    const cookieJar = new Map(cookieHeader.split('; ').filter(Boolean).map((cookie) => [cookie.split('=', 1)[0], cookie]));
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';', 1)[0];
      const [name, ...valueParts] = pair.split('=');
      cookieJar.set(name, pair);
      if (name === 'cf_session') {
        const value = decodeURIComponent(valueParts.join('='));
        if (value.startsWith('s:')) sessionIds.add(value.slice(2).split('.')[0]);
      }
    }
    cookieHeader = [...cookieJar.values()].join('; ');
    const xsrfCookie = cookieJar.get('XSRF-TOKEN');
    csrfToken = decodeURIComponent(xsrfCookie?.slice('XSRF-TOKEN='.length) || '');
  }

  try {
    const csrfResponse = await fetch(`${baseUrl}/auth/csrf`);
    assert.equal(csrfResponse.status, 200);
    updateCookies(csrfResponse);

    const registrationResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ fullName: 'Upload Test', email, password: 'test-password-123' })
    });
    assert.equal(registrationResponse.status, 201);
    updateCookies(registrationResponse);

    const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6XcAAAAASUVORK5CYII=', 'base64');
    const onePhoto = new FormData();
    onePhoto.append('file', new Blob([photo], { type: 'image/png' }), 'single.png');
    const uploadResponse = await fetch(`${baseUrl}/uploads`, {
      method: 'POST',
      headers: { Cookie: cookieHeader, 'X-CSRF-Token': csrfToken },
      body: onePhoto
    });
    assert.equal(uploadResponse.status, 201);
    const uploadedPhoto = (await uploadResponse.json()).data;
    assert.equal(uploadedPhoto.contentType, 'image/png');
    assert.equal(uploadedPhoto.size, photo.length);
    rememberPhoto(uploadedPhoto);

    const maxImageSize = 4 * 1024 * 1024;
    const maxSizePhoto = Buffer.alloc(maxImageSize);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(maxSizePhoto);
    const exactLimitForm = new FormData();
    exactLimitForm.append('file', new Blob([maxSizePhoto], { type: 'image/png' }), 'exact-limit.png');
    const exactLimitResponse = await fetch(`${baseUrl}/uploads`, {
      method: 'POST',
      headers: { Cookie: cookieHeader, 'X-CSRF-Token': csrfToken },
      body: exactLimitForm
    });
    assert.equal(exactLimitResponse.status, 201);
    const exactLimitPhoto = (await exactLimitResponse.json()).data;
    assert.equal(exactLimitPhoto.size, maxImageSize);
    rememberPhoto(exactLimitPhoto);

    const oversizedForm = new FormData();
    oversizedForm.append('file', new Blob([Buffer.concat([maxSizePhoto, Buffer.from([0])])], { type: 'image/png' }), 'oversized.png');
    const oversizedResponse = await fetch(`${baseUrl}/uploads`, {
      method: 'POST',
      headers: { Cookie: cookieHeader, 'X-CSRF-Token': csrfToken },
      body: oversizedForm
    });
    assert.equal(oversizedResponse.status, 413);

    const twoPhotos = new FormData();
    twoPhotos.append('file', new Blob([photo], { type: 'image/png' }), 'first.png');
    twoPhotos.append('file', new Blob([photo], { type: 'image/png' }), 'second.png');
    const rejectedResponse = await fetch(`${baseUrl}/uploads`, {
      method: 'POST',
      headers: { Cookie: cookieHeader, 'X-CSRF-Token': csrfToken },
      body: twoPhotos
    });
    assert.equal(rejectedResponse.status, 400);
    assert.match((await rejectedResponse.json()).error.message, /one image/i);
  } finally {
    await Promise.all([...photoPaths].map((photoPath) => unlink(photoPath).catch(() => {})));
    await prisma.user.deleteMany({ where: { email } });
    await prisma.session.deleteMany({ where: { sid: { in: [...sessionIds] } } });
  }
});

after(async () => {
  await prisma.$disconnect();
});
