import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const villages = db.prepare(`
    SELECT v.*, COUNT(ci.id) as incident_count
    FROM villages v
    LEFT JOIN crime_incidents ci ON v.id = ci.village_id
    GROUP BY v.id
    ORDER BY v.name
  `).all();

  return NextResponse.json({ villages });
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
  const { name, description, population, latitude, longitude } = body;

  if (!name) {
    return NextResponse.json({ error: 'Village name is required' }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO villages (name, description, population, latitude, longitude)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      String(name).trim(),
      description ? String(description).trim() : null,
      population ? parseInt(population) : null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Village name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
