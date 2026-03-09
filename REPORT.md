# Ganda Ward Security Information System
## Technical System Report

---

## Executive Summary

The Ganda Ward Security Information System (GWSIS) is a comprehensive web-based crime incident tracking and management platform designed specifically for Ganda Ward, Kilifi County, Kenya. The system enables law enforcement, village elders, and administrators to effectively monitor, report, and analyze crime incidents across all eight villages in the ward.

---

## 1. System Overview

### 1.1 Purpose
The Ganda Ward Security Information System provides a centralized platform for:
- Recording and tracking crime incidents
- Managing user roles and access control
- Generating statistical reports and analytics
- Visualizing crime data on interactive maps
- Exporting data for external reporting

### 1.2 Target Users
| Role | Description |
|------|-------------|
| **Administrator** | Full system access, user management, all features |
| **Police Officer** | Create, edit, manage incidents, view dashboard |
| **Village Elder** | View incidents in their village, report new incidents |
| **Viewer** | Read-only access to view incidents and reports |

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.9.x |
| Database | SQLite (better-sqlite3) | - |
| Authentication | JWT + bcrypt | - |
| Charts | Chart.js | - |
| Maps | Leaflet.js | - |
| PDF Generation | jsPDF + autoTable | - |
| Styling | Bootstrap 5 | 5.x |
| Package Manager | Bun | Latest |

### 2.2 Project Structure

```
ganda-ward-security-web-application/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── incidents/      # Incident CRUD endpoints
│   │   │   ├── villages/       # Village management
│   │   │   ├── crime-types/    # Crime type management
│   │   │   ├── officers/       # Officer management
│   │   │   ├── users/          # User management
│   │   │   └── dashboard/      # Dashboard data
│   │   ├── login/              # Login page
│   │   ├── dashboard/          # Main dashboard
│   │   ├── incidents/          # Incident management
│   │   │   ├── new/            # Create new incident
│   │   │   ├── [id]/           # View incident
│   │   │   └── [id]/edit/      # Edit incident
│   │   ├── map/                # Crime map
│   │   ├── reports/            # Report generation
│   │   ├── villages/           # Village management
│   │   └── users/              # User management
│   ├── components/             # React components
│   │   └── AppLayout.tsx       # Main layout with sidebar
│   └── lib/                    # Utilities
│       ├── db.ts               # Database configuration
│       └── auth.ts             # Authentication utilities
├── data/                       # SQLite database
├── package.json
├── next.config.ts
└── tsconfig.json
```

### 2.3 Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  badge_number TEXT,
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

#### Villages Table
```sql
CREATE TABLE villages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  population INTEGER,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Crime Types Table
```sql
CREATE TABLE crime_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Officers Table
```sql
CREATE TABLE officers (
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
```

#### Crime Incidents Table
```sql
CREATE TABLE crime_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_number TEXT UNIQUE NOT NULL,
  date_time DATETIME NOT NULL,
  village_id INTEGER REFERENCES villages(id),
  crime_type_id INTEGER REFERENCES crime_types(id),
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  suspect_status TEXT DEFAULT 'unknown',
  officer_id INTEGER REFERENCES officers(id),
  reported_by INTEGER REFERENCES users(id),
  victims_count INTEGER DEFAULT 0,
  property_damage TEXT,
  evidence_collected TEXT,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  village_id INTEGER REFERENCES villages(id),
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Security Features

### 3.1 Authentication
- JWT (JSON Web Token) based authentication
- Password hashing using bcrypt
- Token expiration and refresh handling

### 3.2 Role-Based Access Control (RBAC)
| Feature | Admin | Police Officer | Village Elder | Viewer |
|---------|-------|----------------|---------------|--------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| View All Incidents | ✓ | ✓ | ✗ | ✓ |
| Create Incident | ✓ | ✓ | ✓ | ✗ |
| Edit Incident | ✓ | ✓ | ✗ | ✗ |
| Delete Incident | ✓ | ✗ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| Manage Villages | ✓ | ✗ | ✗ | ✗ |
| Generate Reports | ✓ | ✓ | ✗ | ✓ |
| View Map | ✓ | ✓ | ✓ | ✓ |

### 3.3 Input Validation
- Server-side validation on all API endpoints
- SQL injection protection via parameterized queries
- Input sanitization and type checking

---

## 4. Features Description

### 4.1 Dashboard
The main dashboard provides:
- **Statistics Cards**: Total incidents, open cases, resolved cases, arrests made
- **Bar Chart**: Incidents by village
- **Pie Chart**: Crime type distribution
- **Line Chart**: Monthly incident trends
- **Doughnut Chart**: Case status breakdown
- **Recent Incidents**: List of latest 5 incidents

### 4.2 Incident Management
- **List View**: Filterable and searchable incident list
- **Create**: Form to report new incidents with full details
- **View**: Detailed incident information with timeline
- **Edit**: Modify existing incident records
- **Delete**: Remove incidents (admin only)

### 4.3 Crime Map
Interactive Leaflet.js map showing:
- All incident locations as markers
- Color-coded markers by crime type
- Clickable markers for incident details
- Zoom and pan controls

### 4.4 Report Generation
Export capabilities:
- **PDF Reports**: Formatted reports with tables and charts
- **CSV Export**: Raw data for external analysis
- **Monthly Reports**: Summary by month
- **Quarterly Reports**: Quarterly aggregations

### 4.5 Village Management
- View all villages with population data
- View incidents by village
- High-risk village notifications

### 4.6 User Management (Admin Only)
- Create new users
- Edit user details
- Assign roles
- Deactivate/activate users

---

## 5. Seed Data

### 5.1 Villages (8)
| Name | Description | Population | Coordinates |
|------|-------------|------------|--------------|
| Ganda | Main village center | 2,500 | -3.2197, 40.1169 |
| Mtsanganyiko | Northern village | 1,800 | -3.2050, 40.1250 |
| Mbaraka | Eastern village | 2,100 | -3.2300, 40.1350 |
| Kidimu | Southern village | 1,600 | -3.2400, 40.1100 |
| Mwembeni | Western village | 1,900 | -3.2150, 40.1050 |
| Mnakasa | Central village | 2,200 | -3.2250, 40.1200 |
| KPE | Coastal area village | 1,700 | -3.2000, 40.1300 |
| Mtopanga | Northern coastal village | 1,400 | -3.2450, 40.1000 |

### 5.2 Crime Types (14)
1. Theft
2. Assault
3. Burglary
4. Drug Offenses
5. Domestic Violence
6. Robbery
7. Vandalism
8. Fraud
9. Vehicle Theft
10. Livestock Theft
11. Public Disturbance
12. Illegal Fishing
13. Land Disputes
14. Other

### 5.3 Demo Users
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| officer_kamau | officer123 | Police Officer |
| elder_wanjiku | elder123 | Village Elder |
| viewer1 | viewer123 | Viewer |

---

## 6. API Endpoints

### 6.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/me | Get current user |

### 6.2 Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/incidents | List all incidents |
| POST | /api/incidents | Create new incident |
| GET | /api/incidents/[id] | Get incident details |
| PUT | /api/incidents/[id] | Update incident |
| DELETE | /api/incidents/[id] | Delete incident |

### 6.3 Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/villages | List villages |
| GET | /api/crime-types | List crime types |
| GET | /api/officers | List officers |
| GET | /api/users | List users (admin) |
| GET | /api/dashboard | Dashboard statistics |

---

## 7. Installation & Setup

### 7.1 Prerequisites
- Node.js 20+
- Bun package manager

### 7.2 Installation Steps
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
bun install

# Run the development server
bun dev
```

### 7.3 Access
Open http://localhost:3000 in your browser and log in with demo credentials.

---

## 8. Conclusion

The Ganda Ward Security Information System provides a comprehensive solution for crime incident management in Ganda Ward. With its role-based access control, interactive dashboards, mapping capabilities, and reporting features, it serves as an effective tool for law enforcement and community leaders to maintain security and generate actionable insights from crime data.

---

**Document Version**: 1.0  
**Date**: March 2024  
**Author**: Ganda Ward Security System Development Team
