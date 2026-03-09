import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canEdit } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Allow public access for reading incidents (no auth required)
  const db = getDb();
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  
  const village = searchParams.get('village');
  const crimeType = searchParams.get('crime_type');
  const officer = searchParams.get('officer');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (village) {
    whereClause += ' AND ci.village_id = ?';
    params.push(parseInt(village));
  }
  if (crimeType) {
    whereClause += ' AND ci.crime_type_id = ?';
    params.push(parseInt(crimeType));
  }
  if (officer) {
    whereClause += ' AND ci.officer_id = ?';
    params.push(parseInt(officer));
  }
  if (dateFrom) {
    whereClause += ' AND ci.date_time >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND ci.date_time <= ?';
    params.push(dateTo + ' 23:59:59');
  }
  if (status) {
    whereClause += ' AND ci.status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (ci.description LIKE ? OR ci.location LIKE ? OR ci.incident_number LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  const query = `
    SELECT 
      ci.*,
      v.name as village_name,
      ct.name as crime_type_name,
      ct.severity as crime_severity,
      o.full_name as officer_name,
      o.badge_number as officer_badge
    FROM crime_incidents ci
    LEFT JOIN villages v ON ci.village_id = v.id
    LEFT JOIN crime_types ct ON ci.crime_type_id = ct.id
    LEFT JOIN officers o ON ci.officer_id = o.id
    ${whereClause}
    ORDER BY ci.date_time DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM crime_incidents ci
    LEFT JOIN villages v ON ci.village_id = v.id
    LEFT JOIN crime_types ct ON ci.crime_type_id = ct.id
    LEFT JOIN officers o ON ci.officer_id = o.id
    ${whereClause}
  `;

  const incidents = db.prepare(query).all([...params, limit, offset]);
  const { total } = db.prepare(countQuery).get(params) as { total: number };

  return NextResponse.json({
    incidents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEdit(payload.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
    } = body;

    // Validation
    if (!date_time || !village_id || !crime_type_id || !description || !location) {
      return NextResponse.json(
        { error: 'Required fields: date_time, village_id, crime_type_id, description, location' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Generate incident number
    const year = new Date().getFullYear();
    const countResult = db.prepare(
      "SELECT COUNT(*) as count FROM crime_incidents WHERE incident_number LIKE ?"
    ).get(`INC-${year}-%`) as { count: number };
    const incidentNumber = `INC-${year}-${String(countResult.count + 1).padStart(3, '0')}`;

    const result = db.prepare(`
      INSERT INTO crime_incidents 
      (incident_number, date_time, village_id, crime_type_id, description, location, 
       latitude, longitude, suspect_status, officer_id, reported_by, victims_count, 
       property_damage, evidence_collected)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      incidentNumber,
      date_time,
      parseInt(village_id),
      parseInt(crime_type_id),
      String(description).trim(),
      String(location).trim(),
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      suspect_status || 'unknown',
      officer_id ? parseInt(officer_id) : null,
      payload.userId,
      victims_count ? parseInt(victims_count) : 0,
      property_damage ? String(property_damage).trim() : null,
      evidence_collected ? String(evidence_collected).trim() : null,
    );

    // Check for high-incident village notification
    const villageIncidentCount = db.prepare(
      "SELECT COUNT(*) as count FROM crime_incidents WHERE village_id = ? AND date_time >= date('now', '-30 days')"
    ).get(parseInt(village_id)) as { count: number };

    if (villageIncidentCount.count >= 5) {
      const village = db.prepare('SELECT name FROM villages WHERE id = ?').get(parseInt(village_id)) as { name: string };
      db.prepare(`
        INSERT INTO notifications (title, message, type, village_id)
        VALUES (?, ?, 'warning', ?)
      `).run(
        `High Incident Alert: ${village.name}`,
        `${village.name} has reported ${villageIncidentCount.count} incidents in the last 30 days. Immediate attention required.`,
        parseInt(village_id)
      );
    }

    return NextResponse.json({
      success: true,
      incident_id: result.lastInsertRowid,
      incident_number: incidentNumber,
    }, { status: 201 });
  } catch (error) {
    console.error('Create incident error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
