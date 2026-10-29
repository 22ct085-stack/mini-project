import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import { env } from '../config/env';

export const sessionCookieName = 'scade_session';
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

function getSecret(): string {
  if (!env.authTokenSecret || env.authTokenSecret.length < 32) {
    throw Object.assign(new Error('Sign-in is not configured. Set AUTH_TOKEN_SECRET to at least 32 random characters on the server.'), { statusCode: 503 });
  }
  return env.authTokenSecret;
}

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  const [salt, keyHex, extra] = storedHash.split(':');
  if (extra !== undefined || !/^[a-f\d]{32}$/i.test(salt ?? '') || !/^[a-f\d]{128}$/i.test(keyHex ?? '')) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}

function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds })).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra !== undefined) return null;
  const expectedSignature = createHmac('sha256', getSecret()).update(payload).digest();
  const actualSignature = Buffer.from(suppliedSignature, 'base64url');
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: unknown; exp?: unknown };
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) return null;
    return claims.sub;
  } catch { return null; }
}

export function setSessionCookie(response: Response, userId: string) {
  response.cookie(sessionCookieName, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: sessionLifetimeSeconds * 1000,
    path: '/api/auth',
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',
  });
}

export function getSessionCookie(cookieHeader = ''): string | undefined {
  const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  return entry?.slice(sessionCookieName.length + 1);
}

export function assertAuthConfigured() {
  getSecret();
}

