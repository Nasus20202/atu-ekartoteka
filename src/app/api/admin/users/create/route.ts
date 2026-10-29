import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import {
  EMAIL_TAKEN_MESSAGE,
  validateCredentials,
} from '@/lib/auth/credential-validation';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { createAdminUser } from '@/lib/mutations/users/create-admin-user';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('api:admin:users:create');

export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdmin(
      'Unauthorized user creation attempt'
    );
    if (response) return response;

    const body = await request.json();
    const { email, password, name, role, status } = body;

    logger.info(
      { adminEmail: session.user.email, newUserEmail: email, role },
      'Admin creating new user'
    );

    const validationError = validateCredentials(email, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Validate role
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Nieprawidłowa rola' },
        { status: 400 }
      );
    }

    // Validate status
    if (status && !Object.values(AccountStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy status konta' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      logger.warn(
        { email },
        `User creation failed: ${email} already exists (attempted by ${session.user.email})`
      );
      return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    // Create user
    const user = await createAdminUser({
      email,
      hashedPassword,
      name: name || null,
      role: role || UserRole.TENANT,
      status: status || AccountStatus.PENDING,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'Failed to create user');
    return NextResponse.json(
      { error: 'Nie udało się utworzyć użytkownika' },
      { status: 500 }
    );
  }
}
