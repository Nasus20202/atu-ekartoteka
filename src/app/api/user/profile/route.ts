import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import { createLogger } from '@/lib/logger';
import { updateUserProfile } from '@/lib/mutations/users/update-user-profile';
import { findUserById } from '@/lib/queries/users/find-user-by-id';
import { toUserDto } from '@/lib/types/dto/user-dto';

const logger = createLogger('api:user:profile');

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    const changesRequested = [];
    if (name !== undefined) changesRequested.push('name');
    if (newPassword) changesRequested.push('password');

    logger.info(
      { email: session.user.email, changes: changesRequested },
      'Profile update requested'
    );

    // Get user from database
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Nie znaleziono użytkownika' },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string | null;
      password?: string;
      mustChangePassword?: boolean;
    } = {};

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name || null;
    }

    // Update password if provided
    if (
      newPassword &&
      typeof newPassword === 'string' &&
      newPassword.length < MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        { error: PASSWORD_TOO_SHORT_MESSAGE },
        { status: 400 }
      );
    }

    if (newPassword) {
      // Users with mustChangePassword set may skip the current password check.
      // The database value is authoritative - a stale token must not relax the
      // check (e.g. when an admin forced a password change mid-session).
      const mustChangePassword = user.mustChangePassword;

      if (!mustChangePassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: 'Obecne hasło jest wymagane aby zmienić hasło' },
            { status: 400 }
          );
        }

        // Verify current password
        if (!user.password) {
          return NextResponse.json(
            { error: 'Obecne hasło jest nieprawidłowe' },
            { status: 400 }
          );
        }

        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password
        );

        if (!isPasswordValid) {
          logger.warn(
            { email: session.user.email },
            'Failed password change attempt: incorrect current password'
          );
          return NextResponse.json(
            { error: 'Obecne hasło jest nieprawidłowe' },
            { status: 400 }
          );
        }
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, BCRYPT_COST);
      // Clear the forced change flag whenever a password is successfully changed
      updateData.mustChangePassword = false;
    }

    // Update user
    const updatedUser = await updateUserProfile({
      id: session.user.id,
      ...updateData,
    });

    logger.info(
      { email: session.user.email, changes: changesRequested },
      'Profile updated successfully'
    );

    return NextResponse.json(toUserDto(updatedUser));
  } catch (error) {
    logger.error({ error }, 'Nie udało się zaktualizować profilu');
    return NextResponse.json(
      { error: 'Nie udało się zaktualizować profilu' },
      { status: 500 }
    );
  }
}
