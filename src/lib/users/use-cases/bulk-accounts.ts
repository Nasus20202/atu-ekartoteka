import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { assignApartmentsToUser } from '@/lib/apartments/mutations/assign-apartments-to-user';
import { findUnassignedApartmentsByIds } from '@/lib/apartments/queries/find-unassigned-apartments-by-ids';
import { findUnassignedApartmentsForAssign } from '@/lib/apartments/queries/find-unassigned-apartments-for-assign';
import { BCRYPT_COST } from '@/lib/auth/rules/bcrypt-cost';
import { normalizeEmail } from '@/lib/auth/rules/email';
import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import { failedResult, type UseCaseResult } from '@/lib/shared/use-case-result';
import { createUserWithApartments } from '@/lib/users/mutations/create-user-with-apartments';
import { findUserByEmail } from '@/lib/users/queries/find-user-by-email';

const logger = createLogger('action:bulk-users');

const TEMP_PASSWORD_LENGTH = 12;

export interface BulkCreateSummary {
  created: number;
  skipped: number;
  errors: number;
}

export interface BulkAssignSummary {
  assigned: number;
  skipped: number;
  errors: number;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(TEMP_PASSWORD_LENGTH);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

/** One account per e-mail address, owning every listed apartment that is unassigned. */
export async function bulkCreateAccounts(
  apartmentIds: string[]
): Promise<UseCaseResult<BulkCreateSummary>> {
  try {
    const apartments = await findUnassignedApartmentsByIds(apartmentIds);

    // Group by email (deduplication)
    const emailMap = new Map<
      string,
      { email: string; owner: string | null; aptIds: string[] }
    >();
    for (const apt of apartments) {
      const email = normalizeEmail(apt.email);
      const group = emailMap.get(email);
      if (group) {
        group.aptIds.push(apt.id);
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
        if (await findUserByEmail(email)) {
          skipped++;
          logger.info({ apartmentIds: aptIds }, 'Skipping existing user');
          continue;
        }

        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_COST);

        await createUserWithApartments({
          email,
          hashedPassword,
          owner,
          apartmentIds: aptIds,
        });

        // Fire-and-forget: an email failure does not block the result
        emailService
          .sendAccountActivationEmail(email, tempPassword, owner ?? undefined)
          .catch((err) =>
            logger.error(
              { err, apartmentIds: aptIds },
              'Failed to send activation email'
            )
          );

        created++;
        logger.info({ apartmentIds: aptIds }, 'Created user account');
      } catch (err) {
        errors++;
        logger.error(
          { err, apartmentIds: aptIds },
          'Failed to create user account'
        );
      }
    }

    return { ok: true, data: { created, skipped, errors } };
  } catch (error) {
    logger.error({ error }, 'Bulk create failed');
    return failedResult('Nie udało się utworzyć kont');
  }
}

/** Assigns unassigned apartments to the existing accounts that own their e-mail. */
export async function bulkAssignAccounts(
  apartmentIds: string[]
): Promise<UseCaseResult<BulkAssignSummary>> {
  try {
    const apartments = await findUnassignedApartmentsForAssign(apartmentIds);

    // Deduplicate by email: one existing user may cover multiple apartments
    const emailMap = new Map<string, string[]>();
    for (const apt of apartments) {
      const email = normalizeEmail(apt.email);
      emailMap.set(email, [...(emailMap.get(email) ?? []), apt.id]);
    }

    let assigned = 0;
    let skipped = 0;
    let errors = 0;

    for (const [email, aptIds] of emailMap.entries()) {
      try {
        const existingUser = await findUserByEmail(email);

        if (!existingUser) {
          skipped += aptIds.length;
          logger.info(
            { apartmentIds: aptIds },
            'No existing user found, skipping'
          );
          continue;
        }

        const count = await assignApartmentsToUser(existingUser.id, aptIds);
        assigned += count;
        skipped += aptIds.length - count;

        logger.info(
          { apartmentIds: aptIds },
          'Assigned existing user to apartments'
        );
      } catch (err) {
        errors += aptIds.length;
        logger.error(
          { err, apartmentIds: aptIds },
          'Failed to assign existing user'
        );
      }
    }

    return { ok: true, data: { assigned, skipped, errors } };
  } catch (error) {
    logger.error({ error }, 'Bulk assign failed');
    return failedResult('Nie udało się przypisać mieszkań');
  }
}
