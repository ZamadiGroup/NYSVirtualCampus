# Frontend-Backend Connection Verification

This document verifies that all connections between frontend and backend remain intact after the reorganization.

## ✅ Connection Points Verified

### 1. **Shared Types & Schemas**

- **Location**: `frontend/shared/schema.ts`
- **Backend Reference**: `backend/server/*.ts` uses `import from "@shared/schema"`
- **Frontend Reference**: `frontend/client/src/**/*.ts` uses shared types
- **Path Alias**: Both configured with `@shared/*` → `frontend/shared/*`
- ✅ **Status**: Connected via TypeScript path aliasing

### 2. **API Communication**

- **Frontend Client**: `frontend/client/src/lib/api.ts`
- **Backend Server**: `backend/server/index.ts` (Express on port 5000)
- **Proxy Configuration**: `frontend/vite.config.ts`
  - Dev: Proxy `/api/*` to `http://localhost:5000/api/*`
  - Prod: Backend serves frontend static files
- ✅ **Status**: Connected via HTTP endpoints and Vite proxy

### 3. **Database Configuration**

- **Schema**: `frontend/shared/schema.ts` (single source of truth)
- **Backend Config**: `backend/drizzle.config.ts`
  - References: `../frontend/shared/schema.ts`
- **Migrations**: `backend/migrations/`
- **Environment Variable**: `DATABASE_URL`
- ✅ **Status**: Properly linked via relative path reference

### 4. **Build & Deployment**

- **Root `package.json`**: Orchestrates frontend and backend builds
- **Root `tsconfig.json`**: References both frontend and backend
- **Vercel Config**: `vercel.json` updated to reference new paths
- **Render Config**: `render.yaml` updated with new start commands
- **Build Scripts**: `build.sh` and `build.bat` updated
- ✅ **Status**: All configured for new structure

### 5. **File Structure Mapping**

#### Frontend (`frontend/`)

```
frontend/
├── client/                # React application
│   ├── src/
│   │   ├── components/   # UI Components (shared with backend via schemas)
│   │   ├── pages/        # Page components
│   │   ├── lib/
│   │   │   └── api.ts    # 🔗 Connects to backend /api endpoints
│   │   ├── hooks/        # React hooks
│   │   └── __tests__/    # Tests
│   └── index.html
├── shared/               # 🔗 Shared types (used by both)
│   └── schema.ts         # Zod schemas & TypeScript types
├── attached_assets/      # Images, uploads, generated content
├── package.json
├── tsconfig.json
├── vite.config.ts        # 🔗 Proxy configuration
├── vitest.config.ts
├── postcss.config.js
├── tailwind.config.ts
└── components.json
```

#### Backend (`backend/`)

```
backend/
├── server/               # Express server
│   ├── index.ts          # 🔗 Main server (serves dist/public on root)
│   ├── routes.ts         # 🔗 API route handlers
│   ├── db.ts             # 🔗 Database setup (uses @shared/schema)
│   ├── mongodb.ts        # MongoDB connection
│   ├── jwt.ts            # JWT auth
│   ├── storage.ts        # 🔗 File uploads (uses @shared types)
│   └── vite.ts           # Vite dev server integration
├── api/                  # API functions (serverless)
├── migrations/           # Database migrations
├── scripts/              # Seed scripts
├── sample-data/          # Sample data
├── docs/                 # Documentation
├── package.json
├── tsconfig.json
└── drizzle.config.ts     # 🔗 References ../frontend/shared/schema.ts
```

## 🔄 Data Flow

### Development Mode

```
Frontend (http://localhost:5173)
    ↓
Vite Dev Server
    ↓ (proxy /api/*)
Vite Dev Proxy
    ↓ (http://localhost:5000/api/*)
Backend Express Server (http://localhost:5000)
    ↓
Response (JSON)
    ↓ (with @shared/schema validation)
Frontend API Client
    ↓
React Components
```

### Production Mode

```
Backend Express Server serves:
    ├── Static files from frontend/dist/ → root path (/)
    └── API routes → /api/* paths

Response flow:
Frontend Components
    ↓
API Client (frontend/client/src/lib/api.ts)
    ↓ (HTTP request to /api/*)
Backend Express Server
    ↓
Database (with @shared/schema validation)
    ↓
Response (JSON)
    ↓
Frontend Components (with type safety)
```

## 🧪 Verification Steps

### 1. Check Imports

```bash
# Verify backend imports
grep -r "@shared" backend/server/*.ts

# Should show:
# - backend/server/db.ts imports @shared/schema
# - backend/server/storage.ts imports @shared types
```

### 2. Check Path Aliases

```bash
# Frontend paths (in frontend/tsconfig.json)
"@/*": "client/src/*"
"@shared/*": "shared/*"
"@assets/*": "attached_assets/*"

# Backend paths (in backend/tsconfig.json)
"@shared/*": "../frontend/shared/*"
```

### 3. Check Vite Proxy

```bash
# In frontend/vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  },
}
```

### 4. Check Database Config

```bash
# In backend/drizzle.config.ts
schema: "../frontend/shared/schema.ts"
```

## 📦 Installation & Running

### Install All Dependencies

```bash
npm run install:all
```

### Run Development Environment

```bash
# Both servers in parallel
npm run dev

# Or separately
npm run dev:frontend  # Port 5173
npm run dev:backend   # Port 5000
```

### Build for Production

```bash
npm run build

# This builds:
# 1. frontend → frontend/dist
# 2. backend → backend/dist
```

### Type Checking

```bash
npm run check  # Checks both frontend and backend TypeScript
```

## ⚠️ Important Notes

1. **Shared Code Location**: All shared types are in `frontend/shared/` (not backend), but backend can import from it via path alias
2. **Database URL**: Must be set in `.env` file (referenced by both frontend env and backend)
3. **Port Configuration**:
   - Frontend dev: 5173
   - Backend dev: 5000
   - Change via environment variables if needed
4. **Build Output**:
   - Frontend: `frontend/dist/`
   - Backend: `backend/dist/`
5. **Deployment**: Server starts from `backend/` and serves frontend static from `frontend/dist/`

## 🔗 Reference Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Detailed folder structure and organization
- [README.md](./README.md) - Main project documentation
- Frontend: [client/](./frontend/client/) - React app
- Backend: [server/](./backend/server/) - Express server
- Database: [migrations/](./backend/migrations/) - Database schema migrations
