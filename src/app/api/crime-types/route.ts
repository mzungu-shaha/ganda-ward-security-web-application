import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Allow public access for reading crime types (no auth required)
  const db = getDb();
  const crimeTypes = db.prepare('SELECT * FROM crime_types ORDER BY name').all();
  return NextResponse.json({ crimeTypes });
}
