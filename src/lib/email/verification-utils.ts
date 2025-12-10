import crypto from 'crypto';

/**
 * Hash a token using SHA-256 for secure storage
 * Unlike passwords, tokens are already high-entropy random values,
 * so we use SHA-256 instead of bcrypt for better performance
 * @param token - The plain token to hash
 * @returns The hashed token as hex string
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a random verification code
 * @param length - Length of the code (default: 8)
 * @returns Random alphanumeric code
 */
export function generateVerificationCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}

/**
 * Generate a secure random token for password reset
 * @returns A URL-safe random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Calculate expiration time for verification code
 * @param hours - Number of hours until expiration (default: 24)
 * @returns Date object representing expiration time
 */
export function getVerificationExpiration(hours: number = 24): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
}

/**
 * Check if a verification code has expired
 * @param expiresAt - Expiration date
 * @returns True if expired, false otherwise
 */
export function isVerificationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
