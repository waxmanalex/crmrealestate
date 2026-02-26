# ReCRM — Real Estate CRM

A full-featured real estate CRM built with React + Node.js + PostgreSQL.

## Stack

- **Frontend**: React + TypeScript + Vite + Material UI + React Query + dnd-kit
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT + Refresh Token

## Features

- **Clients** — CRUD, search, filters, activity timeline
- **Properties** — CRUD, photo upload, status management
- **Deals Pipeline** — Kanban board with drag & drop
- **Tasks** — CRUD, overdue highlighting, priority management
- **Dashboard** — KPI cards, charts, upcoming tasks
- **Auth** — JWT with refresh tokens, ADMIN/AGENT roles

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
cp backend/.env.example backend/.env
docker-compose up -d
```

Then seed the database:
```bash
docker-compose exec backend npm run prisma:seed
```

### Option 2: Local Development

**Prerequisites**: Node.js 20+, PostgreSQL 15+

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL

npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Demo Credentials

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@recrm.com    | admin123  |
| Agent | sarah@recrm.com    | agent123  |
| Agent | david@recrm.com    | agent123  |

## Project Structure

```
real-estate-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Demo data
│   └── src/
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, error handling
│       ├── routes/            # Express routes
│       ├── schemas/           # Zod validators
│       ├── utils/             # JWT, bcrypt helpers
│       └── app.ts             # Express app
└── frontend/
    └── src/
        ├── api/               # Axios API layer
        ├── components/        # Shared components
        │   ├── Kanban/        # Drag & drop board
        │   ├── Layout/        # Sidebar, AppLayout
        │   └── Common/        # StatusChip, EmptyState...
        ├── context/           # Auth, Theme contexts
        ├── pages/             # Dashboard, Clients, Properties, Deals, Tasks
        ├── types/             # TypeScript interfaces
        └── theme.ts           # MUI theme (light + dark)
```

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
GET    /api/auth/users

GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id
POST   /api/clients/:id/activities

GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id
POST   /api/properties/:id/photos

GET    /api/deals
POST   /api/deals
GET    /api/deals/:id
PUT    /api/deals/:id
PATCH  /api/deals/:id/stage
DELETE /api/deals/:id

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id

GET    /api/dashboard/metrics?period=30
```
