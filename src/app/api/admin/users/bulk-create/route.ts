import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { getEmailService } from '@/lib/email/email-service';
import { createLogger } from '@/lib/logger';
import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

const logger = createLogger('api:admin:users:bulk-create');

const TEMP_PASSWORD_LENGTH = 12;
const BCRYPT_COST = 10;

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(TEMP_PASSWORD_LENGTH);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const body = await request.json();
    const { apartmentIds } = body as { apartmentIds: string[] };

    if (!Array.isArray(apartmentIds) || apartmentIds.length === 0) {
      return NextResponse.json(
        { error: 'apartmentIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Fetch requested apartments that are still unassigned and have an email
    const apartments = await prisma.apartment.findMany({
      where: {
        id: { in: apartmentIds },
        userId: null,
        email: { not: null },
      },
      select: {
        id: true,
        email: true,
        owner: true,
      },
    });

    // Group by email (deduplication)
    const emailMap = new Map<
      string,
      { email: string; owner: string | null; aptIds: string[] }
    >();
    for (const apt of apartments) {
      const email = apt.email!;
      if (emailMap.has(email)) {
        emailMap.get(email)!.aptIds.push(apt.id);
      } else {
        emailMap.set(email, { email, owner: apt.owner, aptIds: [apt.id] });
      }
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    const emailService = getEmailService();

    for (const { email, owner, aptIds } of emailMap.values()) {
      try {
        // Skip if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          logger.info({ email }, 'Skipping existing user');
          continue;
        }

        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_COST);

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              name: owner ?? null,
              role: UserRole.TENANT,
              status: AccountStatus.APPROVED,
              emailVerified: true,
              mustChangePassword: true,
              authMethod: AuthMethod.CREDENTIALS,
            },
          });

          await tx.apartment.updateMany({
            where: { id: { in: aptIds } },
            data: { userId: user.id },
          });
        });

        // Fire-and-forget — email failure does not block the response
        emailService
          .sendAccountActivationEmail(email, tempPassword, owner ?? undefined)
          .catch((err) =>
            logger.error({ err, email }, 'Failed to send activation email')
          );

        created++;
        logger.info({ email, aptCount: aptIds.length }, 'Created user account');
      } catch (err) {
        errors++;
        logger.error({ err, email }, 'Failed to create user account');
      }
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (error) {
    logger.error({ error }, 'Bulk create failed');
    return NextResponse.json(
      { error: 'Failed to process bulk create' },
      { status: 500 }
    );
  }
}
