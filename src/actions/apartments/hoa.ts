'use server';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import { requireAdminAction } from '@/lib/auth/require-action';
import { createLogger } from '@/lib/logger';
import { updateHoaName } from '@/lib/mutations/hoa/update-hoa-name';

const logger = createLogger('action:hoa');

const MISSING_FIELDS_MESSAGE = 'Brak wymaganych pól';
const RENAME_FAILED_MESSAGE = 'Nie udało się zapisać nazwy wspólnoty';

export async function renameHoaAction(
  id: string,
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  const { denied } = await requireAdminAction('HOA rename attempt');
  if (denied) return denied;

  if (typeof id !== 'string' || typeof name !== 'string' || !id || !name) {
    return invalid(MISSING_FIELDS_MESSAGE);
  }

  try {
    const hoa = await updateHoaName(id, name);
    return { ok: true, data: { id: hoa.id, name: hoa.name } };
  } catch (error) {
    logger.error({ error }, 'HOA update error');
    return failed(RENAME_FAILED_MESSAGE);
  }
}
