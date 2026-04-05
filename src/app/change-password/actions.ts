'use server';

import { redirect } from 'next/navigation';

import { update } from '@/auth';

export async function refreshSessionAndRedirect() {
  await update({});
  redirect('/dashboard');
}
