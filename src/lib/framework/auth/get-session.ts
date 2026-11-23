import { connection } from 'next/server';
import { cache } from 'react';

import { auth } from '@/auth';

/**
 * One session decode per request, shared by layouts and pages. The session
 * read is request time by nature (Auth.js generates random values), so it
 * must never be part of a prerender.
 */
export const getSession = cache(async () => {
  await connection();

  return auth();
});
