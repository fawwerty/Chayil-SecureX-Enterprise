# Chayil SecureX — Windows Quick Start

## Step 1 — You already did this ✅
```powershell
cp .env.example .env
docker-compose up -d
```

## Step 2 — Seed the database (run ONCE)
```powershell
docker exec csx_backend node src/utils/seed.js
```

## Step 3 — Open the platform
- Web App:    http://localhost
- Mobile PWA: http://localhost:3001
- API:        http://localhost:4000/health

## Login Credentials
| Role    | Email                           | Password      |
|---------|---------------------------------|---------------|
| Admin   | admin@chayilsecurex.com         | Admin@2024!   |
| Analyst | analyst@chayilsecurex.com       | Analyst@2024! |
| Client  | client@chayilsecurex.com        | Client@2024!  |

## Useful Docker Commands (PowerShell)
```powershell
# Check all containers are running
docker ps

# Check backend logs
docker logs csx_backend

# Restart everything
docker-compose restart

# Stop everything
docker-compose down

# Stop and wipe database (fresh start)
docker-compose down -v
```

## If backend is still building, wait then check
```powershell
docker ps
# You should see: csx_postgres, csx_redis, csx_backend, csx_frontend, csx_mobile
```

## DO NOT run "npm install" in the chayil_securex root folder
# npm install only belongs INSIDE frontend/ or backend/ folders
# But with Docker you do NOT need to run npm install at all
