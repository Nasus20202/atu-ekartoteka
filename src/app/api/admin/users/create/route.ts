import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('api:admin:users:create');

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      logger.warn(
        { email: session?.user?.email || 'anonymous' },
        'Unauthorized user creation attempt'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, role, status } = body;

    logger.info(
      { adminEmail: session.user.email, newUserEmail: email, role },
      'Admin creating new user'
    );

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate status
    if (status && !Object.values(AccountStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn(
        { email },
        `User creation failed: ${email} already exists (attempted by ${session.user.email})`
      );
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || UserRole.TENANT,
        status: status || AccountStatus.PENDING,
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'Failed to create user');
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
