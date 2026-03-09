# Ganda Ward Security Information System
## User Manual

---

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Login & Authentication](#login--authentication)
4. [Dashboard Overview](#dashboard-overview)
5. [Managing Incidents](#managing-incidents)
6. [Using the Crime Map](#using-the-crime-map)
7. [Generating Reports](#generating-reports)
8. [Managing Villages](#managing-villages)
9. [User Management](#user-management)
10. [Logging Out](#logging-out)

---

## 1. Introduction

The Ganda Ward Security Information System (GWSIS) is a web-based platform designed to help track, manage, and analyze crime incidents in Ganda Ward, Kilifi County, Kenya. This manual will guide you through using all the features of the system.

### System Requirements
- A modern web browser (Chrome, Firefox, Edge, or Safari)
- Internet connection
- Valid user account credentials

---

## 2. Getting Started

### 2.1 Accessing the System
1. Open your web browser
2. Navigate to the application URL
3. You will see the login page

> **Note**: The Dashboard, Crime Map, and Villages pages are publicly accessible without logging in. If you access the login page by mistake, you can use the navigation menu at the top to return to these public areas.

### 2.2 Demo Accounts
The system comes with pre-configured demo accounts:

| Role | Username | Password |
|------|----------|----------|
| Administrator | admin | admin123 |
| Police Officer | officer_kamau | officer123 |
| Village Elder | elder_wanjiku | elder123 |

---

## 3. Login & Authentication

### 3.1 Logging In
1. Enter your **Username** in the first field
2. Enter your **Password** in the second field
3. Click the **Login** button
4. If successful, you will be redirected to the Dashboard
5. If unsuccessful, an error message will appear

### 3.2 Session Management
- The system uses JWT tokens for authentication
- Sessions remain active until you log out
- For security, always log out when finished

---

## 4. Dashboard Overview

The Dashboard is your main view after logging in. It provides an overview of crime statistics and recent activity.

### 4.1 Statistics Cards
At the top of the dashboard, you will see four statistics cards:
- **Total Incidents**: Number of all recorded incidents
- **Open Cases**: Incidents still under investigation
- **Resolved Cases**: Closed or resolved incidents
- **Arrests Made**: Incidents resulting in arrests

### 4.2 Charts
The dashboard includes four interactive charts:

| Chart | Description |
|-------|-------------|
| **Bar Chart** | Shows number of incidents per village |
| **Pie Chart** | Displays crime type distribution |
| **Line Chart** | Shows monthly incident trends |
| **Doughnut Chart** | Displays case status breakdown |

### 4.3 Recent Incidents
A list of the 5 most recent incidents is shown at the bottom of the dashboard. Click on any incident to view its details.

---

## 5. Managing Incidents

### 5.1 Viewing the Incident List
1. Click **Incidents** in the left sidebar
2. You will see a list of all incidents
3. Use the filters to narrow down results:
   - **Search**: Type incident number or description
   - **Village**: Select a specific village
   - **Crime Type**: Filter by type of crime
   - **Status**: Filter by case status
   - **Date Range**: Select start and end dates

### 5.2 Creating a New Incident
1. Click **Incidents** in the sidebar
2. Click the **+ New Incident** button
3. Fill in the incident form:
   - **Incident Date & Time**: When the incident occurred
   - **Village**: Where it occurred
   - **Crime Type**: Type of crime
   - **Description**: Detailed description
   - **Location**: Specific location within the village
   - **GPS Coordinates**: Latitude and longitude (if available)
   - **Suspect Status**: Unknown, Arrested, Under Investigation, At Large
   - **Assign Officer**: Select responsible officer
   - **Number of Victims**: Count of victims
   - **Property Damage**: Description of damage (if any)
   - **Evidence Collected**: List of evidence (if any)
4. Click **Submit** to save the incident

### 5.3 Viewing Incident Details
1. Click **Incidents** in the sidebar
2. Click on any incident in the list
3. A detail page will show all information about the incident

### 5.4 Editing an Incident
1. View an incident's details
2. Click the **Edit** button
3. Modify the necessary fields
4. Click **Update** to save changes

> **Note**: Only Administrators and Police Officers can edit incidents.

### 5.5 Deleting an Incident
1. View an incident's details
2. Click the **Delete** button
3. Confirm the deletion in the popup

> **Note**: Only Administrators can delete incidents.

---

## 6. Using the Crime Map

The Crime Map provides a visual representation of all crime incidents on an interactive map.

### 6.1 Accessing the Map
1. Click **Map** in the left sidebar
2. An interactive map will load showing all incident locations

### 6.2 Map Features
- **Markers**: Each incident is shown as a colored marker
- **Clustering**: When zoomed out, markers may cluster together
- **Click Marker**: Click any marker to see incident details
- **Zoom**: Use mouse wheel or +/- buttons to zoom
- **Pan**: Click and drag to move around the map

### 6.3 Legend
The map legend shows color coding for different crime types. Use this to quickly identify types of crimes in different areas.

---

## 7. Generating Reports

The Reports feature allows you to export crime data for external use.

### 7.1 Accessing Reports
1. Click **Reports** in the left sidebar

### 7.2 Report Options

#### PDF Reports
1. Select **PDF** as the export format
2. Choose the report type:
   - **Monthly Report**: Summary for a specific month
   - **Quarterly Report**: Summary for a 3-month period
3. Select the month/quarter and year
4. Click **Generate PDF**
5. The PDF will download automatically

#### CSV Export
1. Select **CSV** as the export format
2. Apply any desired filters (village, crime type, date range)
3. Click **Export CSV**
4. The CSV file will download automatically

### 7.3 Report Contents
- Summary statistics
- Incident list with details
- Charts and visualizations
- Village-by-village breakdown

---

## 8. Managing Villages

### 8.1 Viewing Villages
1. Click **Villages** in the left sidebar
2. You will see a list of all 8 villages in Ganda Ward

### 8.2 Village Information
For each village, you can view:
- Name
- Description
- Population
- Number of incidents
- Location (latitude/longitude)

### 8.3 Village Incidents
Click on any village to see all incidents reported in that area.

---

## 9. User Management

> **Note**: User Management is only available to Administrators.

### 9.1 Accessing User Management
1. Click **Users** in the left sidebar

### 9.2 Viewing Users
You will see a list of all system users with their:
- Username
- Full Name
- Email
- Role
- Status (Active/Inactive)

### 9.3 Creating a New User
1. Click **Users** in the sidebar
2. Click the **+ Add User** button
3. Fill in the user form:
   - **Username**: Unique login name
   - **Email**: User's email address
   - **Full Name**: Complete name
   - **Password**: Initial password
   - **Role**: Select appropriate role
   - **Badge Number**: For police officers
   - **Phone**: Contact number
4. Click **Create** to add the user

### 9.4 Editing a User
1. Click on a user in the list
2. Click **Edit**
3. Modify the necessary fields
4. Click **Update** to save

### 9.5 Deactivating/Activating Users
1. Edit a user account
2. Toggle the **Active** status
3. Save the changes

---

## 10. Logging Out

### 10.1 How to Log Out
1. Click your username in the top-right corner
2. Select **Logout** from the dropdown menu
3. You will be redirected to the login page

> **Security Tip**: Always log out when leaving your computer, especially in shared or public settings.

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Can't log in | Check your username and password. Contact administrator if still failing |
| Can't see all incidents | Your role may have limited access. Check with your administrator |
| Can't edit/delete incidents | Only certain roles can modify incidents. Contact administrator |
| Map not loading | Check your internet connection |
| PDF not generating | Ensure you have a modern browser with PDF support |

---

## Support

For additional help or to report issues:
- Contact the System Administrator
- Email: admin@gandaward.ke

---

**Document Version**: 1.0  
**Last Updated**: March 2024

