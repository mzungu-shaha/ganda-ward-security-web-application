import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageUsers(payload.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const db = getDb();
  const users = db.prepare(`
    SELECT id, username, email, full_name, role, badge_number, phone, is_active, created_at, last_login
    FROM users
    ORDER BY full_name
  `).all();

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageUsers(payload.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { username, email, password, full_name, role, badge_number, phone } = body;

  if (!username || !email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  const validRoles = ['admin', 'police_officer', 'village_elder'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = getDb();
  try {
    const passwordHash = hashPassword(String(password));
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, badge_number, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(username).trim().toLowerCase(),
      String(email).trim().toLowerCase(),
      passwordHash,
      String(full_name).trim(),
      role,
      badge_number ? String(badge_number).trim() : null,
      phone ? String(phone).trim() : null,
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
