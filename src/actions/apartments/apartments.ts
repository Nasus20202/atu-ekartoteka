'use server';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import { updateApartmentStatus } from '@/lib/apartments/mutations/update-apartment-status';
import { requireAdminAction } from '@/lib/framework/auth/require-action';
import { createLogger } from '@/lib/platform/logging/logger';

const logger = createLogger('action:apartments');

const INVALID_REQUEST_MESSAGE = 'Nieprawidłowe dane żądania';
const STATUS_FAILED_MESSAGE = 'Nie udało się zmienić statusu mieszkania';

export async function setApartmentActiveAction(
  apartmentId: string,
  isActive: boolean
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  const { session, denied } = await requireAdminAction(
    'Apartment status change attempt'
  );
  if (denied) return denied;

  if (typeof apartmentId !== 'string' || !apartmentId) {
    return invalid(INVALID_REQUEST_MESSAGE);
  }
  if (typeof isActive !== 'boolean') {
    return invalid(INVALID_REQUEST_MESSAGE);
  }

  try {
    const apartment = await updateApartmentStatus(apartmentId, isActive);
    logger.info(
      { apartmentId, isActive, adminId: session.user.id },
      'Apartment status updated'
    );
    return {
      ok: true,
      data: { id: apartment.id, isActive: apartment.isActive },
    };
  } catch (error) {
    logger.error({ error }, 'Error updating apartment status');
    return failed(STATUS_FAILED_MESSAGE);
  }
}
