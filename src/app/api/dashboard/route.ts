import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  // Total incidents
  const totalIncidents = (db.prepare('SELECT COUNT(*) as count FROM crime_incidents').get() as { count: number }).count;

  // Incidents by crime type
  const incidentsByCrimeType = db.prepare(`
    SELECT ct.name, COUNT(*) as count, ct.severity
    FROM crime_incidents ci
    JOIN crime_types ct ON ci.crime_type_id = ct.id
    GROUP BY ct.id, ct.name, ct.severity
    ORDER BY count DESC
  `).all();

  // Incidents by village
  const incidentsByVillage = db.prepare(`
    SELECT v.name, COUNT(*) as count
    FROM crime_incidents ci
    JOIN villages v ON ci.village_id = v.id
    GROUP BY v.id, v.name
    ORDER BY count DESC
  `).all();

  // Incidents by month (last 12 months)
  const incidentsByMonth = db.prepare(`
    SELECT 
      strftime('%Y-%m', date_time) as month,
      COUNT(*) as count
    FROM crime_incidents
    WHERE date_time >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', date_time)
    ORDER BY month ASC
  `).all();

  // High-risk villages (top 3 by incident count in last 30 days)
  const highRiskVillages = db.prepare(`
    SELECT v.name, COUNT(*) as count, v.latitude, v.longitude
    FROM crime_incidents ci
    JOIN villages v ON ci.village_id = v.id
    WHERE ci.date_time >= date('now', '-30 days')
    GROUP BY v.id, v.name
    ORDER BY count DESC
    LIMIT 3
  `).all();

  // Incidents by suspect status
  const incidentsBySuspectStatus = db.prepare(`
    SELECT suspect_status, COUNT(*) as count
    FROM crime_incidents
    GROUP BY suspect_status
  `).all();

  // Recent incidents (last 5)
  const recentIncidents = db.prepare(`
    SELECT 
      ci.incident_number,
      ci.date_time,
      ci.description,
      ci.suspect_status,
      ci.status,
      v.name as village_name,
      ct.name as crime_type_name,
      ct.severity as crime_severity
    FROM crime_incidents ci
    LEFT JOIN villages v ON ci.village_id = v.id
    LEFT JOIN crime_types ct ON ci.crime_type_id = ct.id
    ORDER BY ci.date_time DESC
    LIMIT 5
  `).all();

  // Monthly comparison (this month vs last month)
  const thisMonthCount = (db.prepare(`
    SELECT COUNT(*) as count FROM crime_incidents 
    WHERE strftime('%Y-%m', date_time) = strftime('%Y-%m', 'now')
  `).get() as { count: number }).count;

  const lastMonthCount = (db.prepare(`
    SELECT COUNT(*) as count FROM crime_incidents 
    WHERE strftime('%Y-%m', date_time) = strftime('%Y-%m', date('now', '-1 month'))
  `).get() as { count: number }).count;

  // Open vs closed incidents
  const incidentsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM crime_incidents
    GROUP BY status
  `).all();

  // Notifications
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE is_read = 0
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  return NextResponse.json({
    totalIncidents,
    incidentsByCrimeType,
    incidentsByVillage,
    incidentsByMonth,
    highRiskVillages,
    incidentsBySuspectStatus,
    recentIncidents,
    thisMonthCount,
    lastMonthCount,
    incidentsByStatus,
    notifications,
  });
}
