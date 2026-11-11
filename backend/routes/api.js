import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import Busboy from 'busboy';
import { put } from '@vercel/blob';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const router = Router();
const maxImageSize = 4 * 1024 * 1024;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const safeUserFields = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  studentId: true,
  isEmailVerified: true,
  isStudentVerified: true,
  createdAt: true
};

function apiError(status, code, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw apiError(400, 'VALIDATION_FAILED', 'Please check the submitted information.', result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    })));
  }
  return result.data;
}

function requireSession(request) {
  if (!request.session) {
    throw apiError(503, 'SESSION_NOT_CONFIGURED', 'Add SESSION_SECRET and DATABASE_URL to the local environment, then restart the server.');
  }
}

function requireUser(request) {
  requireSession(request);
  if (!request.session.user) throw apiError(401, 'UNAUTHORIZED', 'Please sign in to continue.');
  return request.session.user;
}

function requireAdmin(request) {
  const user = requireUser(request);
  if (user.role !== 'ADMIN') throw apiError(403, 'FORBIDDEN', 'Administrator access is required.');
  return user;
}

function csrfCookie(request, response, token) {
  response.cookie('XSRF-TOKEN', token, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

function readCookie(request, name) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const value = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`))?.trim().slice(name.length + 1);
  return value ? decodeURIComponent(value) : '';
}

function readUploadedImage(request) {
  return new Promise((resolve, reject) => {
    let parser;
    try {
      parser = Busboy({
        headers: request.headers,
        limits: { fileSize: maxImageSize, files: 1, fields: 0, parts: 1 }
      });
    } catch {
      reject(apiError(400, 'INVALID_UPLOAD', 'Choose an image file and try again.'));
      return;
    }

    let failure = null;
    let uploadedImage = null;
    let fileCount = 0;

    parser.on('field', () => {
      failure ||= apiError(400, 'INVALID_UPLOAD', 'The upload must contain one image file.');
    });
    parser.on('file', (fieldName, file, info) => {
      fileCount += 1;
      if (fieldName !== 'file' || fileCount > 1) {
        failure ||= apiError(400, 'INVALID_UPLOAD', 'The upload must contain one image file named file.');
      }
      const chunks = [];
      let size = 0;
      file.on('data', (chunk) => {
        size += chunk.length;
        if (size <= maxImageSize) chunks.push(chunk);
      });
      file.on('limit', () => {
        failure ||= apiError(413, 'UPLOAD_TOO_LARGE', 'Choose an image up to 4 MB.');
      });
      file.on('end', () => {
        if (fieldName === 'file' && fileCount === 1 && size <= maxImageSize) {
          uploadedImage = { buffer: Buffer.concat(chunks), contentType: info.mimeType, size };
        }
      });
    });
    parser.on('filesLimit', () => {
      failure ||= apiError(400, 'INVALID_UPLOAD', 'Upload one image at a time.');
    });
    parser.on('partsLimit', () => {
      failure ||= apiError(400, 'INVALID_UPLOAD', 'The upload must contain only one image file.');
    });
    parser.on('error', () => {
      reject(apiError(400, 'INVALID_UPLOAD', 'The image upload could not be read.'));
    });
    parser.on('close', () => {
      if (failure) return reject(failure);
      if (!uploadedImage) return reject(apiError(400, 'IMAGE_REQUIRED', 'Choose an image file to upload.'));
      resolve(uploadedImage);
    });
    request.on('aborted', () => reject(apiError(400, 'UPLOAD_ABORTED', 'The image upload was interrupted.')));
    request.pipe(parser);
  });
}

function verifiedImageType(buffer, declaredType) {
  let detectedType = null;
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedType = 'image/jpeg';
  } else if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    detectedType = 'image/png';
  } else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    detectedType = 'image/webp';
  }
  return allowedImageTypes.has(detectedType) && detectedType === declaredType ? detectedType : null;
}

async function storeUploadedImage(request) {
  const image = await readUploadedImage(request);
  const contentType = verifiedImageType(image.buffer, image.contentType);
  if (!contentType) {
    throw apiError(400, 'INVALID_IMAGE_TYPE', 'Use a valid JPEG, PNG, or WebP image.');
  }

  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[contentType];
  const filename = `${randomBytes(16).toString('hex')}.${extension}`;

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw apiError(503, 'IMAGE_STORAGE_NOT_CONFIGURED', 'Image uploads are not available right now. Please try again later.');
    }
    const blob = await put(`campusfind/items/${filename}`, image.buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return { url: blob.url, contentType, size: image.size };
  }

  const uploadDirectory = path.join(projectRoot, 'public', 'uploads', 'item-photos');
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), image.buffer, { flag: 'wx' });
  return { url: `/uploads/item-photos/${filename}`, contentType, size: image.size };
}

// Mutating requests must match the token in both the browser cookie and server session.
function csrfCheck(request, _response, next) {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return next();
  try {
    requireSession(request);
    const token = request.get('X-CSRF-Token') || '';
    const cookie = readCookie(request, 'XSRF-TOKEN');
    const expected = Buffer.from(request.session.csrfToken || '');
    const supplied = Buffer.from(token);
    const cookieValue = Buffer.from(cookie);
    const valid = expected.length > 0 && supplied.length === expected.length && cookieValue.length === expected.length
      && timingSafeEqual(supplied, expected)
      && timingSafeEqual(cookieValue, expected);
    if (!valid) throw apiError(403, 'CSRF_TOKEN_INVALID', 'Refresh the page and try again.');
    next();
  } catch (error) {
    next(error);
  }
}

router.use(csrfCheck);

function regenerateSession(request) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

function saveSession(request) {
  return new Promise((resolve, reject) => {
    request.session.save((error) => error ? reject(error) : resolve());
  });
}

function publicItem(item) {
  return {
    id: item.id,
    itemName: item.itemName,
    category: item.category,
    reportType: item.reportType,
    description: item.description,
    location: item.location,
    dateReported: item.dateReported,
    status: item.status,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt
  };
}

const itemInclude = { category: { select: { id: true, name: true, slug: true, iconName: true } } };
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long.')
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long.')
});

router.get('/auth/csrf', (request, response, next) => {
  try {
    requireSession(request);
    request.session.csrfToken ||= randomBytes(32).toString('hex');
    csrfCookie(request, response, request.session.csrfToken);
    response.json({ success: true, data: { csrfToken: request.session.csrfToken } });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/me', (request, response) => {
  const user = request.session?.user;
  if (!user) throw apiError(401, 'UNAUTHORIZED', 'Please sign in to continue.');
  response.json({ success: true, data: { user } });
});

router.post('/auth/register', async (request, response) => {
  requireSession(request);
  const input = parse(registerSchema, request.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw apiError(409, 'CONFLICT', 'An account with that email already exists.');

  const { password, ...accountDetails } = input;
  const user = await prisma.user.create({
    data: { ...accountDetails, passwordHash: await bcrypt.hash(password, 12) },
    select: safeUserFields
  });
  await startUserSession(request, response, user);
  response.status(201).json({ success: true, data: { user } });
});

router.post('/auth/login', async (request, response) => {
  requireSession(request);
  const input = parse(loginSchema, request.body);
  const account = await prisma.user.findUnique({ where: { email: input.email } });
  if (!account || !(await bcrypt.compare(input.password, account.passwordHash))) {
    throw apiError(401, 'UNAUTHORIZED', 'Email or password is incorrect.');
  }
  const user = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    studentId: account.studentId,
    isEmailVerified: account.isEmailVerified,
    isStudentVerified: account.isStudentVerified,
    createdAt: account.createdAt
  };
  await startUserSession(request, response, user);
  response.json({ success: true, data: { user } });
});

async function startUserSession(request, response, user) {
  // Rotate the anonymous session ID after sign-in to prevent session fixation.
  await regenerateSession(request);
  request.session.user = user;
  request.session.csrfToken = randomBytes(32).toString('hex');
  csrfCookie(request, response, request.session.csrfToken);
  await saveSession(request);
}

router.post('/auth/logout', async (request, response) => {
  requireUser(request);
  await new Promise((resolve, reject) => request.session.destroy((error) => error ? reject(error) : resolve()));
  response.clearCookie('cf_session', { path: '/api', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  response.clearCookie('XSRF-TOKEN', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  response.json({ success: true, data: { message: 'Signed out.' } });
});

router.post('/uploads', async (request, response) => {
  requireUser(request);
  const image = await storeUploadedImage(request);
  response.status(201).json({ success: true, data: image });
});

router.get('/categories', async (_request, response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  response.json({ success: true, data: { categories } });
});

router.get('/items', async (request, response) => {
  const search = String(request.query.search || '').trim();
  const reportType = ['LOST', 'FOUND'].includes(request.query.type) ? request.query.type : undefined;
  const categorySlug = String(request.query.category || '');
  const where = {
    status: 'ACTIVE',
    ...(reportType ? { reportType } : {}),
    ...(categorySlug && categorySlug !== 'all' ? { category: { slug: categorySlug } } : {}),
    ...(search ? { OR: [
      { itemName: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } }
    ] } : {})
  };
  const items = await prisma.itemReport.findMany({ where, include: itemInclude, orderBy: { createdAt: 'desc' }, take: 100 });
  response.json({ success: true, data: { items: items.map(publicItem) } });
});

router.get('/items/:id', async (request, response) => {
  const item = await prisma.itemReport.findUnique({ where: { id: request.params.id }, include: itemInclude });
  if (!item || item.status === 'ARCHIVED' || item.status === 'REJECTED') throw apiError(404, 'NOT_FOUND', 'That item report could not be found.');
  response.json({ success: true, data: { item: publicItem(item) } });
});

router.post('/items', async (request, response) => {
  const user = requireUser(request);
  const input = parse(z.object({
    itemName: z.string().trim().min(3).max(120),
    categoryId: z.string().min(1),
    reportType: z.enum(['LOST', 'FOUND']),
    description: z.string().trim().min(5).max(1000),
    location: z.string().trim().min(2).max(160),
    dateReported: z.coerce.date(),
    imageUrl: z.string().max(500).optional().nullable().refine((value) => (
      !value || /^\/uploads\/item-photos\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(value) || z.string().url().safeParse(value).success
    ), 'Choose a valid uploaded image.')
  }), request.body);
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw apiError(400, 'VALIDATION_FAILED', 'Choose a valid item category.');
  const item = await prisma.itemReport.create({
    data: { ...input, imageUrl: input.imageUrl || null, userId: user.id, categoryId: category.id },
    include: itemInclude
  });
  response.status(201).json({ success: true, data: { item: publicItem(item) } });
});

router.get('/users/me', async (request, response) => {
  const user = requireUser(request);
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserFields });
  response.json({ success: true, data: { user: profile } });
});

router.patch('/users/me', async (request, response) => {
  const user = requireUser(request);
  const body = request.body || {};
  if (['role', 'email', 'isEmailVerified', 'isStudentVerified', 'passwordHash'].some((key) => key in body)) {
    throw apiError(403, 'FORBIDDEN', 'Protected account fields cannot be changed here.');
  }
  const input = parse(z.object({
    fullName: z.string().trim().min(2).max(100).optional(),
    studentId: z.string().trim().max(50).nullable().optional()
  }).refine((value) => Object.keys(value).length > 0), body);
  const profile = await prisma.user.update({ where: { id: user.id }, data: input, select: safeUserFields });
  request.session.user = { ...request.session.user, fullName: profile.fullName, studentId: profile.studentId };
  response.json({ success: true, data: { user: profile } });
});

router.get('/users/me/reports', async (request, response) => {
  const user = requireUser(request);
  const reports = await prisma.itemReport.findMany({ where: { userId: user.id }, include: { ...itemInclude, _count: { select: { claims: true } } }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: { reports: reports.map((item) => ({ ...publicItem(item), claimsCount: item._count.claims })) } });
});

router.post('/claims', async (request, response) => {
  const user = requireUser(request);
  const input = parse(z.object({ reportId: z.string().min(1), additionalDetails: z.string().trim().min(5).max(2000) }), request.body);
  const report = await prisma.itemReport.findUnique({ where: { id: input.reportId }, select: { id: true, itemName: true, userId: true, reportType: true, status: true, location: true } });
  if (!report || report.reportType !== 'FOUND' || report.status !== 'ACTIVE') throw apiError(409, 'CONFLICT', 'This found item is no longer available to claim.');
  if (report.userId === user.id) throw apiError(403, 'FORBIDDEN', 'You cannot claim an item that you reported.');

  const claim = await prisma.$transaction(async (tx) => {
    const created = await tx.claim.create({ data: { ...input, claimantId: user.id } });
    await tx.itemReport.update({ where: { id: report.id }, data: { status: 'CLAIM_PENDING' } });
    await tx.notification.create({
      data: {
        userId: report.userId,
        title: 'A claim was submitted',
        message: `Someone submitted an ownership claim for ${report.itemName}.`,
        type: 'CLAIM_UPDATE',
        relatedReportId: report.id,
        relatedClaimId: created.id
      }
    });
    return created;
  });
  response.status(201).json({ success: true, data: { claim } });
});

router.get('/users/me/claims', async (request, response) => {
  const user = requireUser(request);
  const claims = await prisma.claim.findMany({
    where: { claimantId: user.id },
    include: { report: { select: { id: true, itemName: true, location: true, imageUrl: true } } },
    orderBy: { createdAt: 'desc' }
  });
  response.json({ success: true, data: { claims } });
});

router.get('/notifications', async (request, response) => {
  const user = requireUser(request);
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 });
  response.json({ success: true, data: { notifications } });
});

router.patch('/notifications/:id/read', async (request, response) => {
  const user = requireUser(request);
  const notification = await prisma.notification.findFirst({ where: { id: request.params.id, userId: user.id } });
  if (!notification) throw apiError(404, 'NOT_FOUND', 'Notification not found.');
  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
  response.json({ success: true, data: { notification: updated } });
});

router.patch('/notifications/read-all', async (request, response) => {
  const user = requireUser(request);
  const result = await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  response.json({ success: true, data: { updatedCount: result.count } });
});

router.get('/admin/dashboard-stats', async (request, response) => {
  requireAdmin(request);
  const [totalReports, activeLost, activeFound, pendingClaims, resolvedItems] = await Promise.all([
    prisma.itemReport.count(),
    prisma.itemReport.count({ where: { status: 'ACTIVE', reportType: 'LOST' } }),
    prisma.itemReport.count({ where: { status: 'ACTIVE', reportType: 'FOUND' } }),
    prisma.claim.count({ where: { status: 'PENDING' } }),
    prisma.itemReport.count({ where: { status: 'RESOLVED' } })
  ]);
  response.json({ success: true, data: { stats: { totalReports, activeLost, activeFound, pendingClaims, resolvedItems } } });
});

router.get('/admin/claims', async (request, response) => {
  requireAdmin(request);
  const requestedStatus = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'].includes(request.query.status)
    ? request.query.status
    : 'PENDING';
  const claims = await prisma.claim.findMany({
    where: requestedStatus === 'ALL' ? {} : { status: requestedStatus },
    include: {
      claimant: { select: { id: true, fullName: true, email: true } },
      report: { select: { id: true, itemName: true, location: true, dateReported: true } }
    },
    orderBy: { createdAt: 'asc' },
    take: 100
  });
  response.json({ success: true, data: { claims } });
});

router.patch('/admin/claims/:id', async (request, response) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({ decision: z.enum(['APPROVED', 'REJECTED']), decisionNotes: z.string().trim().max(1000).optional().default('') }), request.body);
  const current = await prisma.claim.findUnique({ where: { id: request.params.id }, include: { report: true } });
  if (!current) throw apiError(404, 'NOT_FOUND', 'Claim not found.');
  if (current.status !== 'PENDING') throw apiError(409, 'CONFLICT', 'This claim has already been reviewed.');

  const updated = await prisma.$transaction(async (tx) => {
    const claim = await tx.claim.update({
      where: { id: current.id },
      data: { status: input.decision, decisionNotes: input.decisionNotes, reviewedBy: admin.id, resolvedAt: new Date() }
    });
    if (input.decision === 'APPROVED') {
      const otherPending = await tx.claim.findMany({ where: { reportId: current.reportId, status: 'PENDING', id: { not: current.id } } });
      await tx.itemReport.update({ where: { id: current.reportId }, data: { status: 'RESOLVED' } });
      await tx.claim.updateMany({
        where: { reportId: current.reportId, status: 'PENDING', id: { not: current.id } },
        data: { status: 'REJECTED', decisionNotes: 'The item was awarded to another claimant.', reviewedBy: admin.id, resolvedAt: new Date() }
      });
      for (const other of otherPending) {
        await tx.notification.create({ data: {
          userId: other.claimantId,
          title: 'Claim update',
          message: 'This item was awarded to another claimant.',
          type: 'CLAIM_UPDATE',
          relatedReportId: current.reportId,
          relatedClaimId: other.id
        } });
      }
    } else {
      const remaining = await tx.claim.count({ where: { reportId: current.reportId, status: 'PENDING' } });
      if (!remaining) await tx.itemReport.update({ where: { id: current.reportId }, data: { status: 'ACTIVE' } });
    }
    await tx.notification.create({ data: {
      userId: current.claimantId,
      title: input.decision === 'APPROVED' ? 'Claim approved' : 'Claim not approved',
      message: input.decisionNotes || `Your claim for ${current.report.itemName} was ${input.decision.toLowerCase()}.`,
      type: 'CLAIM_UPDATE',
      relatedReportId: current.reportId,
      relatedClaimId: current.id
    } });
    return claim;
  });
  response.json({ success: true, data: { claim: updated } });
});

export function apiErrorHandler(error, _request, response, next) {
  if (response.headersSent) return next(error);
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  response.status(status).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: status >= 500 ? (error.status ? error.message : 'An unexpected server error occurred.') : error.message,
      ...(error.details ? { details: error.details } : {})
    }
  });
}

export default router;
