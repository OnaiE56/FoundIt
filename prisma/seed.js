import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../backend/utils/prisma.js';

const categories = [
  { name: 'Electronics', slug: 'electronics', iconName: 'laptop' },
  { name: 'Keys & ID Cards', slug: 'keys-cards', iconName: 'key' },
  { name: 'Books & Notebooks', slug: 'books-stationery', iconName: 'book-open' },
  { name: 'Bags & Backpacks', slug: 'bags-backpacks', iconName: 'briefcase' },
  { name: 'Clothing & Accessories', slug: 'clothing', iconName: 'shirt' },
  { name: 'Water Bottles', slug: 'bottles', iconName: 'coffee' },
  { name: 'Other Items', slug: 'other', iconName: 'archive' }
];

async function seed() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, iconName: category.iconName },
      create: category
    });
  }

  const adminEmail = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminName = process.env.ADMIN_INITIAL_NAME?.trim() || 'System Administrator';
  const adminValues = [adminEmail, adminPassword].filter(Boolean).length;

  if (adminValues > 0 && adminValues < 2) {
    throw new Error('Set both ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD to bootstrap an administrator.');
  }

  if (adminEmail && adminPassword) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      throw new Error('ADMIN_INITIAL_EMAIL must be a valid email address.');
    }
    if (adminPassword.length < 12) {
      throw new Error('ADMIN_INITIAL_PASSWORD must be at least 12 characters long.');
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: adminName,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: 'ADMIN',
          isEmailVerified: true,
          isStudentVerified: true
        }
      });
      console.log(`Created initial administrator: ${adminEmail}`);
    } else {
      console.log(`Administrator already exists; left existing credentials unchanged: ${adminEmail}`);
    }
  }

  console.log(`Seeded ${categories.length} categories.`);
}

seed()
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
