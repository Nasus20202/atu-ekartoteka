import bcrypt from 'bcryptjs';
import * as readline from 'readline';

import { prisma } from '@/lib/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

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
      console.log('Admin user already exists');
      console.log(`Email: ${adminExists.email}`);
      return;
    }

    console.log('\n=== Creating Initial Admin User ===\n');

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

    console.log('\n✓ Initial admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}\n`);

    return admin;
  } catch (error) {
    console.error('Error creating initial admin:', error);
    throw error;
  }
}
