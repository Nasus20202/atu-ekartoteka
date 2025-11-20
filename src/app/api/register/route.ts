import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('api:register');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, isFirstAdmin } = body;

    logger.info({ email, isFirstAdmin }, 'Registration attempt');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i hasło są wymagane' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy format email' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 8 znaków' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn({ email }, 'Registration failed: user already exists');
      return NextResponse.json(
        { error: 'Użytkownik z tym adresem email już istnieje' },
        { status: 400 }
      );
    }

    // Check if this is first admin registration
    let role: UserRole = UserRole.TENANT;
    let status: AccountStatus = AccountStatus.PENDING;

    if (isFirstAdmin) {
      // Verify no admin exists
      const adminExists = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      if (adminExists) {
        logger.warn(
          { email },
          'Attempted first admin registration but admin already exists'
        );
        return NextResponse.json(
          { error: 'Administrator już istnieje w systemie' },
          { status: 400 }
        );
      }

      role = UserRole.ADMIN;
      status = AccountStatus.APPROVED;
      logger.info({ email }, 'Creating first admin user');
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role,
        status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info(
      { email: user.email, role: user.role, status: user.status },
      'User registered successfully'
    );

    return NextResponse.json(
      {
        message: 'Konto utworzone pomyślnie',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error }, 'Registration error');
    return NextResponse.json(
      {
        error: 'Nie udało się utworzyć konta',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
