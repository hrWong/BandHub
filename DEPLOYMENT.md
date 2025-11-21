# BandHub Production Deployment Guide (Without Docker)

## Prerequisites

- Node.js 18+ installed on server
- MongoDB instance (local or cloud like MongoDB Atlas)
- Process manager (PM2 recommended)
- Reverse proxy (nginx/Caddy) for HTTPS
- Domain name (optional, for production)

## Step-by-Step Deployment

### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Option B: MongoDB Atlas (Recommended)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string
- Whitelist your server IP

### 3. Clone and Configure Project

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/hrWong/BandHub.git
cd BandHub

# Set proper permissions
sudo chown -R $USER:$USER /var/www/BandHub
```

### 4. Environment Configuration

```bash
# Create production environment file
cp env.template .env.production.local

# Edit environment variables
nano .env.production.local
```

**Required environment variables:**
```env
# MongoDB (use your actual connection string)
MONGODB_URI=mongodb://localhost:27017/bandhub
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bandhub

# NextAuth (CRITICAL: Generate secure secret)
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://yourdomain.com
# OR for testing:
# NEXTAUTH_URL=http://your-server-ip:3000

# Admin Configuration (auto bootstrap on startup)
ADMIN_NAME=BandHub Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password

# Production mode
NODE_ENV=production
```

**Generate secure secret:**
```bash
openssl rand -base64 32
```

### 5. Install Dependencies and Build

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build
```

This creates an optimized production build in `.next/` directory.

### 6. Start with PM2

**Create PM2 ecosystem file:**
```bash
nano ecosystem.config.js
```

**Add configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'bandhub',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/BandHub',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

**Start application:**
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

**Useful PM2 commands:**
```bash
pm2 status              # Check status
pm2 logs bandhub        # View logs
pm2 restart bandhub     # Restart app
pm2 stop bandhub        # Stop app
pm2 delete bandhub      # Remove from PM2
pm2 monit               # Monitor resources
```

### 7. Configure Nginx (Recommended)

**Install nginx:**
```bash
sudo apt install -y nginx
```

**Create nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/bandhub
```

**Add configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/bandhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### 9. Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Updating the Application

When you push new code to GitHub:

```bash
cd /var/www/BandHub

# Pull latest changes
git pull origin main

# Install any new dependencies
npm ci --only=production

# Rebuild application
npm run build

# Restart with PM2
pm2 restart bandhub
```

**Create update script:**
```bash
nano update.sh
```

```bash
#!/bin/bash
cd /var/www/BandHub
git pull origin main
npm ci --only=production
npm run build
pm2 restart bandhub
echo "BandHub updated successfully!"
```

```bash
chmod +x update.sh
```

## Monitoring and Maintenance

### View Logs
```bash
# PM2 logs
pm2 logs bandhub

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backup
```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mongodump --db bandhub --out $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
chmod +x backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /var/www/BandHub/backup.sh
```

### Monitor Resources
```bash
pm2 monit              # Real-time monitoring
pm2 status             # Check status
htop                   # System resources
```

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs bandhub --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Verify environment variables
pm2 env 0
```

### Database connection issues
```bash
# Test MongoDB connection
mongosh "your_mongodb_uri"

# Check MongoDB status (if local)
sudo systemctl status mongod
```

### High memory usage
```bash
# Restart application
pm2 restart bandhub

# Check memory
pm2 monit
```

## Performance Optimization

### Enable Next.js Caching
Already configured with `output: 'standalone'` in `next.config.ts`

### Use CDN for Static Assets
Configure nginx to cache static files:
```nginx
location /_next/static {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, max-age=3600, immutable";
}
```

### Database Indexing
Ensure MongoDB indexes are created (automatically handled by Mongoose schemas)

## Security Checklist

- ✅ Use strong `NEXTAUTH_SECRET`
- ✅ Enable HTTPS with SSL certificate
- ✅ Configure firewall (UFW)
- ✅ Use MongoDB authentication
- ✅ Keep Node.js and dependencies updated
- ✅ Regular database backups
- ✅ Monitor logs for suspicious activity
- ✅ Use environment variables for secrets

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `pm2 start ecosystem.config.js` | Start with PM2 |
| `pm2 restart bandhub` | Restart application |
| `pm2 logs bandhub` | View logs |
| `pm2 monit` | Monitor resources |
| `sudo systemctl restart nginx` | Restart nginx |
| `./update.sh` | Update application |

---

**Need help?** Check logs first: `pm2 logs bandhub`
