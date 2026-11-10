'use server';

import bcrypt from 'bcrypt';
import crypto from 'crypto';

import {
  type ActionResult,
  failed,
  invalid,
  readInput,
} from '@/actions/action-result';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import { requireAdminAction } from '@/lib/auth/require-action';
import { getEmailService } from '@/lib/email/email-service';
import { createLogger } from '@/lib/logger';
import { assignApartmentsToUser } from '@/lib/mutations/apartments/assign-apartments-to-user';
import { createUserWithApartments } from '@/lib/mutations/users/create-user-with-apartments';
import { findUnassignedApartmentsByIds } from '@/lib/queries/apartments/find-unassigned-apartments-by-ids';
import { findUnassignedApartmentsForAssign } from '@/lib/queries/apartments/find-unassigned-apartments-for-assign';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';

const logger = createLogger('action:bulk-users');

const TEMP_PASSWORD_LENGTH = 12;
const NO_APARTMENTS_MESSAGE = 'Wybierz co najmniej jedno mieszkanie';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(TEMP_PASSWORD_LENGTH);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

function readApartmentIds(input: unknown): string[] | null {
  const { apartmentIds } = readInput(input);

  return Array.isArray(apartmentIds) &&
    apartmentIds.length > 0 &&
    apartmentIds.every((id) => typeof id === 'string')
    ? apartmentIds
    : null;
}

export async function bulkCreateAccountsAction(
  input: unknown
): Promise<ActionResult<{ created: number; skipped: number; errors: number }>> {
  const { denied } = await requireAdminAction('Unauthorized bulk create');
  if (denied) return denied;

  const apartmentIds = readApartmentIds(input);
  if (!apartmentIds) return invalid(NO_APARTMENTS_MESSAGE);

  try {
    const apartments = await findUnassignedApartmentsByIds(apartmentIds);

    // Group by email (deduplication)
    const emailMap = new Map<
      string,
      { email: string; owner: string | null; aptIds: string[] }
    >();
    for (const apt of apartments) {
      const group = emailMap.get(apt.email);
      if (group) {
        group.aptIds.push(apt.id);
      } else {
        emailMap.set(apt.email, {
          email: apt.email,
          owner: apt.owner,
          aptIds: [apt.id],
        });
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
    return failed('Nie udało się utworzyć kont');
  }
}

export async function bulkAssignAccountsAction(
  input: unknown
): Promise<
  ActionResult<{ assigned: number; skipped: number; errors: number }>
> {
  const { denied } = await requireAdminAction('Unauthorized bulk assign');
  if (denied) return denied;

  const apartmentIds = readApartmentIds(input);
  if (!apartmentIds) return invalid(NO_APARTMENTS_MESSAGE);

  try {
    const apartments = await findUnassignedApartmentsForAssign(apartmentIds);

    // Deduplicate by email: one existing user may cover multiple apartments
    const emailMap = new Map<string, string[]>();
    for (const apt of apartments) {
      emailMap.set(apt.email, [...(emailMap.get(apt.email) ?? []), apt.id]);
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
    return failed('Nie udało się przypisać mieszkań');
  }
}
