# Ganda Ward Security Information System
## Deployment and Installation Guide

---

## Document Information

| Field | Details |
|-------|---------|
| **Document Title** | Deployment and Installation Guide |
| **Version** | 1.0 |
| **Date** | March 2024 |
| **Author** | Ganda Ward Security System Development Team |

---

## 1. Overview

This guide provides comprehensive instructions for deploying the Ganda Ward Security Information System (GWSIS) in various environments. The system is a Next.js 16 web application with SQLite database.

---

## 2. System Requirements

### 2.1 Development Environment

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Operating System | Ubuntu 20.04+ / Windows 10+ / macOS 11+ | Ubuntu 22.04 LTS |
| Node.js | 20.x | 20.x LTS |
| Bun | Latest | Latest stable |
| RAM | 4 GB | 8 GB |
| Disk Space | 10 GB | 20 GB |
| Browser | Chrome 90+ / Firefox 88+ / Edge 90+ | Latest versions |

### 2.2 Production Environment

| Resource | Small Deployment | Medium Deployment |
|----------|-----------------|-------------------|
| **Server** | | |
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| **Network** | | |
| Bandwidth | 10 Mbps | 50 Mbps |
| SSL Certificate | Required | Required |
| **Database** | | |
| Type | Local SQLite | Managed SQLite |

---

## 3. Installation Steps

### 3.1 Prerequisites Installation

#### Install Bun (Package Manager)

```bash
# Ubuntu/Debian
curl -fsSL https://bun.sh/install | bash

# macOS
brew install bun

# Windows (using PowerShell)
powershell -ExecutionPolicy Bypass -c "irm bun.sh/install.ps1"
```

#### Verify Installation

```bash
bun --version
```

Expected output: `1.x.x` or higher

### 3.2 Application Setup

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd ganda-ward-security
```

#### Step 2: Install Dependencies

```bash
bun install
```

#### Step 3: Environment Configuration

Create `.env.local` file:

```bash
# Generate JWT secret
openssl rand -base64 32

# Create .env.local
cat > .env.local << EOF
JWT_SECRET=your-generated-secret-here
NODE_ENV=production
EOF
```

#### Step 4: Database Initialization

The database is automatically created and seeded on first run:

```bash
bun run build
```

This will:
- Create SQLite database
- Create all tables
- Seed 8 villages
- Seed 14 crime types
- Seed demo users
- Seed 20 sample incidents

### 3.3 Development Deployment

```bash
# Start development server
bun run dev
```

Access at: `http://localhost:3000`

### 3.4 Production Deployment

#### Option A: Standalone Server

```bash
# Build the application
bun run build

# Start production server
bun run start
```

#### Option B: PM2 Process Manager

```bash
# Install PM2
bun add -g pm2

# Start with PM2
pm2 start npm --name "gwsis" -- run start

# Set up startup script
pm2 startup
pm2 save
```

---

## 4. Server Configuration

### 4.1 Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name gwsis.kilifi.go.ke;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gwsis.kilifi.go.ke;
    
    ssl_certificate /etc/ssl/certs/gwsis.crt;
    ssl_certificate_key /etc/ssl/private/gwsis.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 SSL Certificate Setup

Using Let's Encrypt (Free):

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d gwsis.kilifi.go.ke

# Auto-renewal
sudo certbot renew --dry-run
```

### 4.3 Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 5. Cloud Deployment

### 5.1 AWS Deployment

#### EC2 Instance Setup

1. Launch EC2 instance (t3.small minimum)
2. Configure Security Group:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)
3. Attach Elastic IP

#### Installation

```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone <repo>
cd ganda-ward-security
bun install

# Build
bun run build

# Start with PM2
pm2 start npm --name "gwsis" -- run start
```

### 5.2 Azure Deployment

1. Create Virtual Machine (Ubuntu 20.04)
2. Configure Network Security Group:
   - Inbound: 80, 443, 22
3. Set up DNS zone
4. Deploy application

### 5.3 Vercel Deployment (Recommended for Next.js)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your-org
# - Want to modify settings? No
```

---

## 6. Database Configuration

### 6.1 Backup Configuration

Create backup script (`backup.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gwsis"
mkdir -p $BACKUP_DIR

# Copy database
cp data/gwsis.db "$BACKUP_DIR/gwsis_$DATE.db"

# Compress
gzip "$BACKUP_DIR/gwsis_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: gwsis_$DATE.db.gz"
```

Make executable and schedule:

```bash
chmod +x backup.sh
crontab -e

# Add line for daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 6.2 Restore Procedure

```bash
# Stop the application
pm2 stop gwsis

# Restore database
gunzip < backup_file.gz > data/gwsis.db

# Start the application
pm2 start gwsis
```

---

## 7. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `NODE_ENV` | No | development | Environment (production/development) |
| `PORT` | No | 3000 | Server port |
| `DATABASE_PATH` | No | ./data/gwsis.db | Database file path |

---

## 8. Performance Optimization

### 8.1 Next.js Optimization

```bash
# Build with optimization
bun run build

# Output standalone mode
# Already configured in next.config.ts
```

### 8.2 Caching Configuration

Enable static caching in production:

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',
  headers: [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400',
        },
      ],
    },
  ],
};
```

---

## 9. Monitoring & Logging

### 9.1 PM2 Monitoring

```bash
# View logs
pm2 logs gwsis

# Monitor status
pm2 monit

# View processes
pm2 status
```

### 9.2 Log Rotation

```bash
# Install log rotation
sudo pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | `pm2 delete all` then restart |
| Database locked | Check file permissions |
| Build fails | Run `bun install` again |
| 502 Bad Gateway | Check if app is running with `pm2 status` |
| SSL errors | Regenerate certificates |

### 10.2 Health Check

```bash
# Check if server is responding
curl -I http://localhost:3000

# Expected: HTTP/1.1 200 OK
```

---

## 11. Post-Deployment Checklist

- [ ] SSL certificate installed and working
- [ ] Application starts without errors
- [ ] Database initialized with seed data
- [ ] All pages load correctly
- [ ] Login works for all demo accounts
- [ ] Dashboard charts render
- [ ] Map displays correctly
- [ ] Reports generate successfully
- [ ] Backup script configured
- [ ] Monitoring set up
- [ ] Firewall configured
- [ ] Domain DNS pointing correctly

---

## 12. Support

For deployment assistance:
- Email: admin@gandaward.ke
- Technical Support: +254 700 000000

---

**Document Version**: 1.0  
**Last Updated**: March 2024

---

*End of Deployment Guide*
