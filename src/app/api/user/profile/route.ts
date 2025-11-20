import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: { name?: string; password?: string } = {};

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name || null;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      // Verify current password
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

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
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
