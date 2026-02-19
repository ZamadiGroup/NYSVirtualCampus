# NYS Virtual Campus - Frontend and Backend Structure

This project has been reorganized into separate **frontend** and **backend** directories while maintaining all internal connections.

## Directory Structure

```
NYSVirtualCampus/
├── frontend/                          # Frontend application
│   ├── client/                        # React application
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   ├── pages/                # Page components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities and API clients
│   │   │   └── __tests__/            # Frontend tests
│   │   └── index.html
│   ├── shared/                        # Shared types and schemas
│   │   └── schema.ts                  # Zod schemas and type definitions
│   ├── attached_assets/               # Images and uploaded files
│   │   ├── generated_images/
│   │   └── uploads/
│   ├── package.json                   # Frontend dependencies
│   ├── tsconfig.json                  # Frontend TypeScript config
│   ├── vite.config.ts                 # Frontend build config
│   ├── vitest.config.ts               # Frontend test config
│   ├── tailwind.config.ts             # TailwindCSS config
│   └── postcss.config.js              # PostCSS config
│
├── backend/                           # Backend application
│   ├── server/                        # Express server
│   │   ├── index.ts                   # Server entry point
│   │   ├── routes.ts                  # API routes
│   │   ├── db.ts                      # Database setup
│   │   ├── mongodb.ts                 # MongoDB connection
│   │   ├── jwt.ts                     # JWT configuration
│   │   ├── storage.ts                 # File storage logic
│   │   └── vite.ts                    # Vite integration
│   ├── migrations/                    # Database migrations
│   ├── scripts/                       # Utility scripts
│   ├── sample-data/                   # Sample data for seeding
│   ├── docs/                          # Backend documentation
│   ├── package.json                   # Backend dependencies
│   ├── tsconfig.json                  # Backend TypeScript config
│   └── drizzle.config.ts              # Database ORM config
│
├── package.json                       # Root package.json (monorepo config)
└── tsconfig.json                      # Root TypeScript config

```

## Key Connections

### Frontend → Backend Communication

**Frontend** (`frontend/client/src/lib/api.ts`) makes API calls to **Backend** (running on `http://localhost:5000`):

- All API requests use the `/api` endpoint
- The Vite dev server proxies `/api/*` to `http://localhost:5000/api/*`
- Built frontend assets are served by the backend Express server

### Shared Code

**`frontend/shared/`** contains:

- Type definitions and Zod schemas used by both frontend and backend
- Backend imports from `@shared/schema.ts` to validate data
- Frontend imports from `@shared/` for type safety

### Path Aliases

Both frontend and backend use TypeScript path aliases:

**Frontend:**

```json
{
  "@/*": "client/src/*",
  "@shared/*": "shared/*",
  "@assets/*": "attached_assets/*"
}
```

**Backend:**

```json
{
  "@shared/*": "../frontend/shared/*"
}
```

## Running the Application

### Install Dependencies

```bash
# Install root dependencies and all workspace dependencies
npm run install:all

# Or individually
cd frontend && npm install
cd ../backend && npm install
```

### Development

**Run both frontend and backend:**

```bash
npm run dev
```

**Run individually:**

```bash
npm run dev:frontend    # Frontend on http://localhost:5173
npm run dev:backend     # Backend on http://localhost:5000
```

### Production Build

```bash
npm run build           # Build both frontend and backend
npm run build:frontend  # Build only frontend
npm run build:backend   # Build only backend
```

### Type Checking

```bash
npm run check           # Check both
npm run check:frontend  # Check frontend types
npm run check:backend   # Check backend types
```

### Testing

```bash
npm run test            # Run all tests
npm run test:frontend   # Run frontend tests
npm run test:backend    # Run backend tests
npm run test:watch      # Watch mode for all
```

## Development Workflow

1. **Frontend Development:**
   - Start dev server: `npm run dev:frontend`
   - Access at `http://localhost:5173`
   - Backend API available via Vite proxy to `http://localhost:5000`

2. **Backend Development:**
   - Start dev server: `npm run dev:backend`
   - Server runs on port `5000`
   - Automatically reloads on file changes

3. **Type Checking:**
   - Frontend uses `@` alias for client code
   - Backend uses `@shared` alias to reference shared types from frontend
   - Both can use TypeScript's strict mode

## Important Files

- **Root `package.json`**: Orchestrates frontend and backend commands
- **Root `tsconfig.json`**: References both frontend and backend includes
- **`frontend/vite.config.ts`**: Configures API proxy and shared paths
- **`backend/drizzle.config.ts`**: References schema from `frontend/shared`
- **`frontend/shared/schema.ts`**: Single source of truth for data types

## Environment Variables

Create `.env` in the project root (affects both frontend and backend):

- `DATABASE_URL`: Database connection string
- `NODE_ENV`: development or production
- `PORT`: Server port (default: 5000)
- `API_URL`: Frontend API endpoint

## Troubleshooting

**Port conflicts:**

- Frontend dev server uses `5173`
- Backend dev server uses `5000`
- Change via environment variables if needed

**Module resolution issues:**

- Ensure path aliases are consistent in both `tsconfig.json` files
- Backend must reference shared as `../frontend/shared`

**Build issues:**

- Clear `node_modules` and reinstall: `npm run install:all`
- Check that all config files are in correct directories

## Additional Documentation

See individual READMEs or docs:

- `backend/docs/`: Backend-specific documentation
- `frontend/client/`: Frontend specific setup
