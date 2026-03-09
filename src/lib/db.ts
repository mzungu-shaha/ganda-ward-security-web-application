import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'ganda_ward.db');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'police_officer', 'village_elder', 'viewer')),
      badge_number TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS villages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      population INTEGER,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crime_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      badge_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      rank TEXT NOT NULL,
      station TEXT,
      phone TEXT,
      email TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crime_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_number TEXT UNIQUE NOT NULL,
      date_time DATETIME NOT NULL,
      village_id INTEGER REFERENCES villages(id),
      crime_type_id INTEGER REFERENCES crime_types(id),
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      suspect_status TEXT DEFAULT 'unknown' CHECK(suspect_status IN ('unknown', 'arrested', 'under_investigation', 'at_large')),
      officer_id INTEGER REFERENCES officers(id),
      reported_by INTEGER REFERENCES users(id),
      victims_count INTEGER DEFAULT 0,
      property_damage TEXT,
      evidence_collected TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'under_investigation', 'referred')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'danger', 'success')),
      village_id INTEGER REFERENCES villages(id),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed initial data if tables are empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database.Database) {
  const bcrypt = require('bcryptjs');
  const adminHash = bcrypt.hashSync('admin123', 10);
  const officerHash = bcrypt.hashSync('officer123', 10);
  const elderHash = bcrypt.hashSync('elder123', 10);
  const viewerHash = bcrypt.hashSync('viewer123', 10);

  // Insert default users
  db.prepare(`
    INSERT INTO users (username, email, password_hash, full_name, role, badge_number, phone) VALUES
    ('admin', 'admin@gandaward.go.ke', ?, 'System Administrator', 'admin', 'ADM001', '+254700000001'),
    ('officer_kamau', 'kamau@gandaward.go.ke', ?, 'Sgt. John Kamau', 'police_officer', 'KPS001', '+254700000002'),
    ('elder_wanjiku', 'wanjiku@gandaward.go.ke', ?, 'Mary Wanjiku', 'village_elder', NULL, '+254700000003'),
    ('viewer1', 'viewer@gandaward.go.ke', ?, 'Community Viewer', 'viewer', NULL, '+254700000004')
  `).run(adminHash, officerHash, elderHash, viewerHash);

  // Insert villages
  db.prepare(`
    INSERT INTO villages (name, description, population, latitude, longitude) VALUES
    ('Ganda Central', 'Main village center', 2500, -3.2197, 40.1169),
    ('Mwembe', 'Northern village', 1800, -3.2050, 40.1250),
    ('Kibarani', 'Eastern village', 2100, -3.2300, 40.1350),
    ('Mwakijembe', 'Southern village', 1600, -3.2400, 40.1100),
    ('Mwandoni', 'Western village', 1900, -3.2150, 40.1050),
    ('Bomani', 'Central-east village', 2200, -3.2250, 40.1200),
    ('Mwazangombe', 'Northern-east village', 1700, -3.2000, 40.1300),
    ('Mwakamba', 'Southern-west village', 1400, -3.2450, 40.1000)
  `).run();

  // Insert crime types
  db.prepare(`
    INSERT INTO crime_types (name, description, severity) VALUES
    ('Theft', 'Stealing of property', 'medium'),
    ('Assault', 'Physical attack on a person', 'high'),
    ('Burglary', 'Breaking and entering a building', 'high'),
    ('Drug Trafficking', 'Illegal drug trade and distribution', 'critical'),
    ('Domestic Violence', 'Violence within household', 'high'),
    ('Robbery', 'Theft with force or threat', 'high'),
    ('Vandalism', 'Deliberate destruction of property', 'low'),
    ('Fraud', 'Deception for financial gain', 'medium'),
    ('Kidnapping', 'Unlawful detention of a person', 'critical'),
    ('Murder', 'Unlawful killing of a person', 'critical'),
    ('Sexual Assault', 'Non-consensual sexual act', 'critical'),
    ('Arson', 'Deliberate setting of fire', 'high'),
    ('Trespassing', 'Unauthorized entry to property', 'low'),
    ('Cybercrime', 'Criminal activity via internet', 'medium')
  `).run();

  // Insert officers
  db.prepare(`
    INSERT INTO officers (user_id, badge_number, full_name, rank, station, phone, email) VALUES
    (2, 'KPS001', 'Sgt. John Kamau', 'Sergeant', 'Ganda Police Post', '+254700000002', 'kamau@gandaward.go.ke'),
    (NULL, 'KPS002', 'Cpl. Jane Mwangi', 'Corporal', 'Ganda Police Post', '+254700000005', 'mwangi@gandaward.go.ke'),
    (NULL, 'KPS003', 'PC. David Ochieng', 'Police Constable', 'Ganda Police Post', '+254700000006', 'ochieng@gandaward.go.ke'),
    (NULL, 'KPS004', 'Sgt. Fatuma Hassan', 'Sergeant', 'Ganda Police Post', '+254700000007', 'hassan@gandaward.go.ke')
  `).run();

  // Insert sample incidents
  const now = new Date();
  const incidents = [
    {
      num: 'INC-2024-001', dt: '2024-01-15 14:30:00', village: 1, crime: 1,
      desc: 'Mobile phone stolen from market area', loc: 'Ganda Central Market',
      lat: -3.2197, lng: 40.1169, status: 'unknown', officer: 1
    },
    {
      num: 'INC-2024-002', dt: '2024-01-20 22:15:00', village: 2, crime: 3,
      desc: 'House broken into, electronics stolen', loc: 'Mwembe Residential Area',
      lat: -3.2050, lng: 40.1250, status: 'under_investigation', officer: 2
    },
    {
      num: 'INC-2024-003', dt: '2024-02-05 18:45:00', village: 3, crime: 2,
      desc: 'Fight at local bar resulting in injuries', loc: 'Kibarani Bar Street',
      lat: -3.2300, lng: 40.1350, status: 'arrested', officer: 1
    },
    {
      num: 'INC-2024-004', dt: '2024-02-12 09:00:00', village: 4, crime: 5,
      desc: 'Domestic violence reported by neighbor', loc: 'Mwakijembe Village',
      lat: -3.2400, lng: 40.1100, status: 'under_investigation', officer: 3
    },
    {
      num: 'INC-2024-005', dt: '2024-02-28 20:30:00', village: 1, crime: 4,
      desc: 'Drug trafficking operation discovered', loc: 'Ganda Central Back Alley',
      lat: -3.2200, lng: 40.1175, status: 'arrested', officer: 4
    },
    {
      num: 'INC-2024-006', dt: '2024-03-10 16:00:00', village: 5, crime: 6,
      desc: 'Armed robbery at shop', loc: 'Mwandoni Shopping Center',
      lat: -3.2150, lng: 40.1050, status: 'unknown', officer: 2
    },
    {
      num: 'INC-2024-007', dt: '2024-03-15 11:30:00', village: 6, crime: 1,
      desc: 'Livestock theft reported', loc: 'Bomani Farm Area',
      lat: -3.2250, lng: 40.1200, status: 'under_investigation', officer: 1
    },
    {
      num: 'INC-2024-008', dt: '2024-04-02 23:00:00', village: 2, crime: 3,
      desc: 'School broken into, equipment stolen', loc: 'Mwembe Primary School',
      lat: -3.2060, lng: 40.1260, status: 'unknown', officer: 3
    },
    {
      num: 'INC-2024-009', dt: '2024-04-18 15:20:00', village: 7, crime: 7,
      desc: 'Public property vandalized', loc: 'Mwazangombe Community Center',
      lat: -3.2000, lng: 40.1300, status: 'unknown', officer: 4
    },
    {
      num: 'INC-2024-010', dt: '2024-05-05 08:45:00', village: 3, crime: 2,
      desc: 'Assault during land dispute', loc: 'Kibarani Farm Boundary',
      lat: -3.2310, lng: 40.1360, status: 'arrested', officer: 2
    },
    {
      num: 'INC-2024-011', dt: '2024-05-20 19:00:00', village: 1, crime: 8,
      desc: 'Mobile money fraud reported', loc: 'Ganda Central',
      lat: -3.2197, lng: 40.1169, status: 'under_investigation', officer: 1
    },
    {
      num: 'INC-2024-012', dt: '2024-06-08 14:00:00', village: 4, crime: 5,
      desc: 'Domestic violence with serious injuries', loc: 'Mwakijembe',
      lat: -3.2410, lng: 40.1110, status: 'arrested', officer: 3
    },
    {
      num: 'INC-2024-013', dt: '2024-06-25 21:30:00', village: 8, crime: 6,
      desc: 'Night robbery on main road', loc: 'Mwakamba Road',
      lat: -3.2450, lng: 40.1000, status: 'unknown', officer: 4
    },
    {
      num: 'INC-2024-014', dt: '2024-07-12 10:15:00', village: 5, crime: 4,
      desc: 'Drug den discovered and raided', loc: 'Mwandoni Outskirts',
      lat: -3.2160, lng: 40.1060, status: 'arrested', officer: 1
    },
    {
      num: 'INC-2024-015', dt: '2024-07-30 17:45:00', village: 6, crime: 1,
      desc: 'Motorcycle theft at market', loc: 'Bomani Market',
      lat: -3.2255, lng: 40.1205, status: 'under_investigation', officer: 2
    },
    {
      num: 'INC-2024-016', dt: '2024-08-14 13:00:00', village: 2, crime: 2,
      desc: 'Gang fight with weapons', loc: 'Mwembe Junction',
      lat: -3.2055, lng: 40.1255, status: 'arrested', officer: 3
    },
    {
      num: 'INC-2024-017', dt: '2024-08-28 20:00:00', village: 1, crime: 3,
      desc: 'Warehouse burglary', loc: 'Ganda Central Industrial',
      lat: -3.2205, lng: 40.1180, status: 'unknown', officer: 4
    },
    {
      num: 'INC-2024-018', dt: '2024-09-10 09:30:00', village: 7, crime: 5,
      desc: 'Domestic violence case', loc: 'Mwazangombe Residential',
      lat: -3.2005, lng: 40.1305, status: 'under_investigation', officer: 1
    },
    {
      num: 'INC-2024-019', dt: '2024-09-22 16:30:00', village: 3, crime: 4,
      desc: 'Drug trafficking at school vicinity', loc: 'Kibarani School Area',
      lat: -3.2305, lng: 40.1355, status: 'arrested', officer: 2
    },
    {
      num: 'INC-2024-020', dt: '2024-10-05 22:45:00', village: 8, crime: 6,
      desc: 'Armed robbery at petrol station', loc: 'Mwakamba Petrol Station',
      lat: -3.2455, lng: 40.1005, status: 'under_investigation', officer: 3
    }
  ];

  const insertIncident = db.prepare(`
    INSERT INTO crime_incidents 
    (incident_number, date_time, village_id, crime_type_id, description, location, latitude, longitude, suspect_status, officer_id, reported_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'open')
  `);

  for (const inc of incidents) {
    insertIncident.run(inc.num, inc.dt, inc.village, inc.crime, inc.desc, inc.loc, inc.lat, inc.lng, inc.status, inc.officer);
  }
}
