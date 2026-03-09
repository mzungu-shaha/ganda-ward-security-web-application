import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'ganda-ward-security-secret-2024';
const JWT_EXPIRES_IN = '24h';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'police_officer' | 'village_elder';
  badge_number?: string;
  phone?: string;
  is_active: number;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }
  
  // Also check cookies
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }
  
  return null;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id) as User | null;
}

export function getUserByUsername(username: string): (User & { password_hash: string }) | null {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as (User & { password_hash: string }) | null;
}

export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canEdit(role: string): boolean {
  return ['admin', 'police_officer'].includes(role);
}

export function canDelete(role: string): boolean {
  return role === 'admin';
}

export function canManageUsers(role: string): boolean {
  return role === 'admin';
}
