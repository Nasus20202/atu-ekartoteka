import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { updateUserProfile } from '@/lib/mutations/users/update-user-profile';
import { findUserById } from '@/lib/queries/users/find-user-by-id';

const logger = createLogger('api:user:profile');

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 8 znaków' },
        { status: 400 }
      );
    }

    if (newPassword) {
      // Users with mustChangePassword set may skip the current password check
      const mustChangePassword = session.user.mustChangePassword;

      if (!mustChangePassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: 'Current password is required to change password' },
            { status: 400 }
          );
        }

        // Verify current password
        if (!user.password) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
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
            { error: 'Current password is incorrect' },
            { status: 400 }
          );
        }
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 10);
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error({ error }, 'Failed to update profile');
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
