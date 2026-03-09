import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canEdit, canDelete } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const incident = db.prepare(`
    SELECT 
      ci.*,
      v.name as village_name,
      ct.name as crime_type_name,
      ct.severity as crime_severity,
      o.full_name as officer_name,
      o.badge_number as officer_badge,
      o.rank as officer_rank,
      u.full_name as reported_by_name
    FROM crime_incidents ci
    LEFT JOIN villages v ON ci.village_id = v.id
    LEFT JOIN crime_types ct ON ci.crime_type_id = ct.id
    LEFT JOIN officers o ON ci.officer_id = o.id
    LEFT JOIN users u ON ci.reported_by = u.id
    WHERE ci.id = ?
  `).get(parseInt(id));

  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  return NextResponse.json({ incident });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEdit(payload.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  
  const existing = db.prepare('SELECT * FROM crime_incidents WHERE id = ?').get(parseInt(id));
  if (!existing) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const {
      date_time,
      village_id,
      crime_type_id,
      description,
      location,
      latitude,
      longitude,
      suspect_status,
      officer_id,
      victims_count,
      property_damage,
      evidence_collected,
      status,
    } = body;

    db.prepare(`
      UPDATE crime_incidents SET
        date_time = COALESCE(?, date_time),
        village_id = COALESCE(?, village_id),
        crime_type_id = COALESCE(?, crime_type_id),
        description = COALESCE(?, description),
        location = COALESCE(?, location),
        latitude = ?,
        longitude = ?,
        suspect_status = COALESCE(?, suspect_status),
        officer_id = ?,
        victims_count = COALESCE(?, victims_count),
        property_damage = ?,
        evidence_collected = ?,
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      date_time || null,
      village_id ? parseInt(village_id) : null,
      crime_type_id ? parseInt(crime_type_id) : null,
      description ? String(description).trim() : null,
      location ? String(location).trim() : null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      suspect_status || null,
      officer_id ? parseInt(officer_id) : null,
      victims_count ? parseInt(victims_count) : null,
      property_damage ? String(property_damage).trim() : null,
      evidence_collected ? String(evidence_collected).trim() : null,
      status || null,
      parseInt(id)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update incident error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canDelete(payload.role)) {
    return NextResponse.json({ error: 'Only admins can delete incidents' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  
  const existing = db.prepare('SELECT * FROM crime_incidents WHERE id = ?').get(parseInt(id));
  if (!existing) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM crime_incidents WHERE id = ?').run(parseInt(id));
  return NextResponse.json({ success: true });
}
