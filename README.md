# 🔐 Chayil SecureX — Enterprise Cybersecurity Platform v2.0

> **Africa's Premier Enterprise Cybersecurity SaaS Platform**  
> Cyber Assurance · IT Auditing · Risk Management · Kali Linux Tools · OSINT · Threat Intelligence

![Version](https://img.shields.io/badge/version-2.0.0-gold)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20PostgreSQL%20%7C%20Expo-teal)
![Standard](https://img.shields.io/badge/standard-$10K%20Agency%20Grade-gold)

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CHAYIL SECUREX PLATFORM v2.0                    │
├──────────────┬──────────────────────┬───────────────────────────────┤
│   FRONTEND   │       BACKEND        │        MOBILE (EXPO)          │
│  React/Vite  │   Node.js/Express    │   React Native + Expo         │
│  Port: 5173  │     Port: 4000       │   expo start                  │
│              │                      │                                │
│  4 Portals:  │  REST API + WS       │  Home (Hero + Auth)           │
│  • Landing   │  BullMQ Queues       │  Dashboard → Scan             │
│  • Admin     │  Kali Tool Engine    │  Threats → OSINT              │
│  • Analyst   │  Live IOC Feeds      │  Incidents → Profile          │
│  • Client    │  AI Assistant        │                                │
└──────┬───────┴──────────┬───────────┴───────────────────────────────┘
       │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────────────────────────────┐
│  PostgreSQL │  │     Redis       │  │   Docker / Kali Sandbox     │
│  Port: 5432 │  │   Port: 6379    │  │   nmap · nikto · nuclei     │
│  13 tables  │  │   BullMQ Jobs   │  │   sqlmap · amass · etc      │
└─────────────┘  └─────────────────┘  └─────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Docker (for real Kali tool execution)
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`

---

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set DB credentials, API keys

# Start PostgreSQL + Redis via Docker (easiest):
docker run -d --name csx_postgres \
  -e POSTGRES_DB=chayil_securex \
  -e POSTGRES_USER=chayil \
  -e POSTGRES_PASSWORD=chayil_secret \
  -p 5432:5432 postgres:16-alpine

docker run -d --name csx_redis -p 6379:6379 redis:7-alpine

# Run migrations + seed demo data:
node src/utils/seed.js

# Start dev server:
npm run dev
# → API running at http://localhost:4000
# → WebSocket on ws://localhost:4000/ws
```

---

### 2. Frontend (Web Portal)

```bash
cd frontend
npm install
cp .env.example .env   # Set VITE_API_URL=http://localhost:4000
npm run dev
# → App at http://localhost:5173
```

---

### 3. Mobile App (Expo)

```bash
cd mobile-expo
npm install
cp .env.example .env   # Set EXPO_PUBLIC_API_URL

# Start with Expo Go (fastest — scan QR with phone):
npx expo start

# Run on iOS simulator:
npx expo start --ios

# Run on Android emulator:
npx expo start --android

# Build standalone APK (Android):
eas build --platform android --profile preview

# Build for iOS TestFlight:
eas build --platform ios --profile preview
```

**On your phone:**
1. Install [Expo Go](https://expo.dev/go) from App Store / Play Store
2. Run `npx expo start` in the `mobile-expo` folder
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)
4. The app opens with the hero screen → tap "Get Started" → Login/Signup

---

### 4. Full Docker Stack (All-in-one)

```bash
cp .env.example .env
docker-compose up -d
docker exec csx_backend node src/utils/seed.js  # first run only
```

| Service    | URL                         |
|------------|-----------------------------|
| Frontend   | http://localhost:80          |
| API        | http://localhost:4000        |
| Mobile PWA | http://localhost:3001        |

---

## 🔑 Demo Credentials

| Role     | Email                        | Password       | Access          |
|----------|------------------------------|----------------|-----------------|
| **Admin**    | admin@chayilsecurex.com  | Admin@2024!    | Full platform   |
| **Analyst**  | analyst@chayilsecurex.com| Analyst@2024!  | SOC + tools     |
| **Client**   | client@chayilsecurex.com | Client@2024!   | Reports + assets|

---

## 🛠️ Kali Tools

| Tool            | Category    | Real Execution  |
|-----------------|-------------|-----------------|
| **nmap**        | Network     | ✅ Docker/Real  |
| **nikto**       | Web Vuln    | ✅ Docker/Real  |
| **nuclei**      | Vuln Scan   | ✅ Docker/Real  |
| **theHarvester**| OSINT       | ✅ Docker/Real  |
| **amass**       | OSINT       | ✅ Docker/Real  |
| **sqlmap**      | Web         | ✅ Docker/Real  |
| **wafw00f**     | WAF         | ✅ Docker/Real  |
| **whatweb**     | Fingerprint | ✅ Docker/Real  |

> Set `USE_DOCKER=true` in backend `.env` and run `docker-compose up kali-tools` for live execution.  
> Default is **simulation mode** — realistic outputs without needing Docker.

---

## 🌐 API Reference

```
POST /api/auth/login          → { token, user }
GET  /api/auth/me             → { user }

GET  /api/scans/tools         → Available tools list
POST /api/scans               → Launch scan
GET  /api/scans/:id           → Poll scan result

POST /api/osint/domain        → Domain intelligence (WHOIS/DNS/VT)
POST /api/osint/ip            → IP intelligence (AbuseIPDB/Shodan/VT)
POST /api/osint/email         → Email OSINT
POST /api/osint/hash          → File hash lookup

GET  /api/threats             → IOC database
POST /api/threats/check       → Check value against IOC + external APIs
POST /api/threats/ioc         → Add IOC
GET  /api/threats/enrich/:val → Enrich via AbuseIPDB/VirusTotal

GET  /api/dashboard/stats     → Live dashboard metrics
GET  /api/assets              → Asset inventory
GET  /api/incidents           → Incident management
GET  /api/compliance          → Framework controls
GET  /api/audit               → Audit trail
POST /api/contact             → Contact form
```

---

## 🔒 Security Controls

| Control           | Implementation                               |
|-------------------|----------------------------------------------|
| Authentication    | JWT (24h) + bcrypt password hashing          |
| Authorization     | RBAC — admin / analyst / client              |
| Tool sandbox      | Docker isolated network                      |
| Input validation  | Joi schemas + shell metachar stripping        |
| Rate limiting     | 100/15min global + 20/hr scans               |
| Audit logging     | Every action logged to PostgreSQL            |
| API security      | Helmet.js + CORS whitelist                   |
| SQL injection     | Parameterized queries only                   |
| Mobile storage    | Expo SecureStore (encrypted keychain)        |

---

## 📱 Mobile App Features

The Expo mobile app (`mobile-expo/`) provides:

- **Home Screen** — Animated hero with particle effects, stats, and auth bottom sheet
- **Sign In / Sign Up** — Full auth with demo access buttons
- **Dashboard** — Live stats, alerts, quick actions, risk domains
- **Scan Launcher** — All 8 Kali tools with live console output
- **Threat Intelligence** — IOC checker with AbuseIPDB/VT enrichment
- **OSINT** — Domain, IP, email, and hash lookups
- **Incidents** — Full incident triage with status updates
- **Profile** — Settings, certifications, biometric auth toggle

---

## 🌍 About Chayil SecureX

Based in **Accra, Ghana** — Chayil SecureX delivers world-class information security:

- **Cyber Assurance** — Independent control assurance for boards & regulators
- **IT & Security Auditing** — ISO 27001, COBIT, NIST, Ghana NDPA aligned
- **Risk Management** — Enterprise risk registers & treatment planning
- **Compliance** — SOC 2, PCI-DSS, GDPR, Ghana NDPA readiness
- **Vulnerability Assessment** — Technical scanning & penetration testing
- **CISO Advisory** — Virtual CISO & strategic security roadmaps

**Contact:** info@chayilsecurex.com | **Web:** www.chayilsecurex.com  
**Location:** Accra, Ghana

---

© 2025 Chayil SecureX. All rights reserved. Proprietary & Confidential.
