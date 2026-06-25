import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { col } from './db';
import { v4 as uuid } from 'uuid';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const test = scryptSync(password, salt, 64).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch {
    return false;
  }
}

export async function createSession(userId) {
  const token = uuid() + uuid();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const sessions = await col('sessions');
  await sessions.insertOne({ token, userId, createdAt: new Date(), expiresAt });
  const jar = await cookies();
  jar.set('session', token, { httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get('session')?.value;
  if (token) {
    const sessions = await col('sessions');
    await sessions.deleteOne({ token });
  }
  jar.delete('session');
}

export async function getCurrentUser() {
  try {
    const jar = await cookies();
    const token = jar.get('session')?.value;
    if (!token) return null;
    const sessions = await col('sessions');
    const s = await sessions.findOne({ token });
    if (!s) return null;
    if (new Date(s.expiresAt) < new Date()) return null;
    const users = await col('users');
    const u = await users.findOne({ id: s.userId });
    if (!u) return null;
    return { id: u.id, name: u.name, email: u.email, role: u.role };
  } catch (e) {
    return null;
  }
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error('UNAUTHORIZED');
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== 'admin') throw new Error('FORBIDDEN');
  return u;
}
