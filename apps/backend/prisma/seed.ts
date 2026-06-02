import { PrismaClient, UserRole, ReaderAvailability } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords
  const saltRounds = 10;

  const adminPassword = await bcrypt.hash('AdminTarot2026!', saltRounds);
  const clientPassword = await bcrypt.hash('ClientTarot2026!', saltRounds);
  const readerPassword = await bcrypt.hash('ReaderTarot2026!', saltRounds);
  const demoBirthDate = new Date('1990-01-01T00:00:00.000Z');
  const verifiedUserData = {
    birthDate: demoBirthDate,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    emailVerificationTokenHash: null,
    emailVerificationTokenExpiresAt: null,
  };

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tarot.com' },
    update: verifiedUserData,
    create: {
      firstName: 'Admin',
      lastName: 'System',
      birthDate: demoBirthDate,
      email: 'admin@tarot.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),

      wallet: {
        create: {
          balance: 0.0
        }
      }
    }
  });

  console.log('Created Admin:', admin.email);

  // 2. Create Client
  const client = await prisma.user.upsert({
    where: { email: 'client@tarot.com' },
    update: verifiedUserData,
    create: {
      firstName: 'Cliente',
      lastName: 'Demo',
      birthDate: demoBirthDate,
      email: 'client@tarot.com',
      passwordHash: clientPassword,
      role: UserRole.CLIENT,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),

      wallet: {
        create: {
          balance: 100.0
        }
      }
    }
  });

  console.log('Created Client:', client.email);

  // 3. Create Tarot Reader
  const readerUser = await prisma.user.upsert({
    where: { email: 'reader@tarot.com' },
    update: verifiedUserData,
    create: {
      firstName: 'Sophia',
      lastName: 'Moon',
      birthDate: demoBirthDate,
      email: 'reader@tarot.com',
      passwordHash: readerPassword,
      role: UserRole.TAROT_READER,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),

      wallet: {
        create: {
          balance: 0.0
        }
      }
    }
  });

  const readerProfile = await prisma.tarotReader.upsert({
    where: { userId: readerUser.id },
    update: {},
    create: {
      userId: readerUser.id,
      displayName: 'Madame Sophia',
      bio: 'Experta en Tarot de Marsella y Astrología evolutiva con más de 10 años de experiencia.',
      ratePerMinute: 5.50,
      availability: ReaderAvailability.ONLINE
    }
  });

  console.log(
    'Created Tarot Reader:',
    readerProfile.displayName,
    'with Rate:',
    readerProfile.ratePerMinute.toString()
  );

  console.log('Database seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
