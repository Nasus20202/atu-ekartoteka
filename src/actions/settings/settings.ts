'use server';

import { type ActionResult, failed, invalid } from '@/actions/action-result';
import { requireAdminAction } from '@/lib/auth/require-action';
import { createLogger } from '@/lib/logger';
import { updateAppSettings } from '@/lib/mutations/settings/update-app-settings';
import {
  type AppSettingsValues,
  parseAppSettingsUpdate,
} from '@/lib/settings/registry';

const logger = createLogger('action:settings');

const INVALID_SETTINGS_MESSAGE = 'Nieprawidłowe ustawienia';
const SAVE_FAILED_MESSAGE = 'Nie udało się zapisać ustawień';

export async function updateSettingsAction(
  input: unknown
): Promise<ActionResult<AppSettingsValues>> {
  const { denied } = await requireAdminAction('Settings update attempt');
  if (denied) return denied;

  const update = parseAppSettingsUpdate(input);
  if (update === null) return invalid(INVALID_SETTINGS_MESSAGE);

  try {
    return { ok: true, data: await updateAppSettings(update) };
  } catch (error) {
    logger.error({ error }, 'Settings update error');
    return failed(SAVE_FAILED_MESSAGE);
  }
}
