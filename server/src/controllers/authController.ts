import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import User from '../models/User';
import { assertAuthConfigured, clearSessionCookie, getSessionCookie, hashPassword, setSessionCookie, verifyPassword, verifySessionToken } from '../services/authService';

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const registerSchema = z.object({ name: z.string().trim().min(1).max(80), email: emailSchema, password: z.string().min(8).max(128) });
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });

function databaseReady(response: Response): boolean {
  if (mongoose.connection.readyState === 1) return true;
  response.status(503).json({ success: false, error: 'Account sign-in is unavailable because the database is not connected.' });
  return false;
}

function publicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function register(request: Request, response: Response, next: NextFunction) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ success: false, error: 'Enter a name, valid email, and password with at least 8 characters.' });
  if (!databaseReady(response)) return;
  try {
    assertAuthConfigured();
    const { name, email, password } = parsed.data;
    const user = new User({ name, email, passwordHash: await hashPassword(password) });
    await user.save();
    setSessionCookie(response, user.id);
    return response.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return response.status(409).json({ success: false, error: 'An account with that email already exists. Sign in instead.' });
    }
    return next(error);
  }
}

export async function login(request: Request, response: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ success: false, error: 'Enter a valid email and password.' });
  if (!databaseReady(response)) return;
  try {
    assertAuthConfigured();
    const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash');
    if (!user || !await verifyPassword(parsed.data.password, user.passwordHash)) {
      return response.status(401).json({ success: false, error: 'Email or password is incorrect.' });
    }
    setSessionCookie(response, user.id);
    return response.json({ success: true, user: publicUser(user) });
  } catch (error) { return next(error); }
}

export async function currentUser(request: Request, response: Response, next: NextFunction) {
  if (!databaseReady(response)) return;
  try {
    const token = getSessionCookie(request.headers.cookie);
    const userId = token ? verifySessionToken(token) : null;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      clearSessionCookie(response);
      return response.status(401).json({ success: false, error: 'Sign in to access your account.' });
    }
    const user = await User.findById(userId).select('name email');
    if (!user) {
      clearSessionCookie(response);
      return response.status(401).json({ success: false, error: 'Your account could not be found. Please sign in again.' });
    }
    return response.json({ success: true, user: publicUser(user) });
  } catch (error) { return next(error); }
}

export function logout(_request: Request, response: Response) {
  clearSessionCookie(response);
  return response.json({ success: true });
}


