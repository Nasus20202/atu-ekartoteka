import bcrypt from 'bcryptjs';
import * as readline from 'readline';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { AccountStatus, UserRole } from '@/lib/types';

const logger = createLogger('init:admin');

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function createInitialAdmin() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (adminExists) {
      logger.info('Admin user already exists');
      logger.info(`Email: ${adminExists.email}`);
      return;
    }

    logger.info('\n=== Creating Initial Admin User ===\n');

    const email = await promptUser('Enter admin email: ');
    const name = await promptUser('Enter admin name: ');
    const password = await promptUser('Enter admin password: ');

    if (!email || !name || !password) {
      throw new Error('All fields are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
      },
    });

    logger.info('\n✓ Initial admin user created successfully!');
    logger.info(`Email: ${admin.email}`);
    logger.info(`Name: ${admin.name}\n`);

    return admin;
  } catch (error) {
    logger.error({ error }, 'Error creating initial admin');
    throw error;
  }
}
