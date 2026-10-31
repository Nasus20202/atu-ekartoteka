import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { updateAppSettings } from '@/lib/mutations/settings/update-app-settings';
import { getAppSettings } from '@/lib/queries/settings/get-app-settings';
import { parseAppSettingsUpdate } from '@/lib/settings/registry';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:settings');

const INVALID_SETTINGS_MESSAGE = 'Nieprawidłowe ustawienia';

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    return NextResponse.json(await getAppSettings());
  } catch (error) {
    logger.error({ error }, 'Settings fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać ustawień',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { response } = await requireAdmin('Settings update attempt');
    if (response) return response;

    const body: unknown = await req.json().catch(() => null);
    const update = parseAppSettingsUpdate(body);

    if (update === null) {
      return NextResponse.json(
        { error: INVALID_SETTINGS_MESSAGE },
        { status: 400 }
      );
    }

    return NextResponse.json(await updateAppSettings(update));
  } catch (error) {
    logger.error({ error }, 'Settings update error');
    return NextResponse.json(
      {
        error: 'Nie udało się zapisać ustawień',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
