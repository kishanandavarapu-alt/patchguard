# 🛡️ PatchGuard — Security Patch Automation Framework

## Project Structure
```
patchguard/
├── frontend/                  # Next.js 14 + Tailwind
│   └── src/
│       ├── app/
│       │   ├── dashboard/     # Stats + charts + activity
│       │   ├── endpoints/     # Scanned machines
│       │   ├── vulnerabilities/ # CVE table + deploy
│       │   ├── patches/       # Patch history
│       │   ├── logs/          # Audit trail
│       │   ├── alerts/        # Admin alerts
│       │   └── login/         # Auth
│       ├── components/        # Shared UI components
│       ├── lib/               # Supabase + API clients
│       └── types/             # TypeScript interfaces
│
└── backend/                   # Node.js + Express
    ├── routes/
    │   ├── endpoints.js       # GET /api/endpoints
    │   ├── scan.js            # POST /api/scan
    │   ├── vulnerabilities.js # GET /api/vulnerabilities
    │   ├── patch.js           # POST /api/patch/deploy
    │   ├── logs.js            # GET /api/logs
    │   └── alerts.js          # GET/POST /api/alerts
    ├── lib/supabase.js        # DB client
    └── server.js              # Entry point
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env      # Fill in your keys
npm install
npm run dev               # Runs on :3001
```

### Frontend
```bash
cd frontend
cp .env.example .env.local  # Fill in your keys
npm install
npm run dev               # Runs on :3000
```

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/endpoints | All scanned endpoints |
| POST   | /api/scan | Scan endpoint for CVEs |
| POST   | /api/scan/all | Scan all endpoints |
| GET    | /api/vulnerabilities | CVE list with filters |
| POST   | /api/patch/deploy | Deploy patch |
| GET    | /api/logs | Patch audit logs |
| GET    | /api/alerts | Admin alerts |
| POST   | /api/alerts | Create + email alert |
