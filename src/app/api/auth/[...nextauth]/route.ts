/* eslint-disable local/require-api-auth-guard -- Auth.js sign-in endpoints must be reachable while signed out */
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
