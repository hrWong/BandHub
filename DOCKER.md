# BandHub Docker Deployment Guide

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/hrWong/BandHub.git
cd BandHub
```

### 2. Configure environment variables
```bash
cp env.template .env
# Edit .env and set your values (especially NEXTAUTH_SECRET)
```

### 3. Start with Docker Compose
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

## What's Included

- **Next.js Application**: Production-optimized build
- **MongoDB Database**: Persistent data storage
- **Automatic Health Checks**: Ensures services are running correctly

## Environment Variables

Edit `.env` file to configure:

- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your deployment URL (default: http://localhost:3000)
- `ADMIN_NAME`: Optional display name for the bootstrap admin
- `ADMIN_EMAIL`: Admin user email (must match what you'll use to log in)
- `ADMIN_PASSWORD`: Admin user password

## Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f app
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Remove all data (including database)
```bash
docker-compose down -v
```

## Production Deployment

For production deployment:

1. **Update environment variables** in `.env`:
   - Generate a strong `NEXTAUTH_SECRET`
   - Set `NEXTAUTH_URL` to your domain
   - Set `ADMIN_EMAIL`/`ADMIN_PASSWORD` (and optional `ADMIN_NAME`) so the admin account is bootstrapped automatically on startup
   - Use strong MongoDB credentials

2. **Use a reverse proxy** (nginx/Caddy) for HTTPS

3. **Backup MongoDB data** regularly:
   ```bash
   docker exec bandhub-mongodb mongodump --out /backup
   ```

## Troubleshooting

### Port already in use
If port 3000 or 27017 is already in use, edit `docker-compose.yml` to change the ports.

### Database connection issues
Check MongoDB is healthy:
```bash
docker-compose ps
```

### View application logs
```bash
docker-compose logs -f app
```
