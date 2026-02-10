# Clinic CRM - Production Multi-Tenant Application

A production-grade, multi-tenant Clinic CRM system enabling patient appointment booking, real-time notifications, medical record management, WhatsApp integration, and smart feedback routing.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: NestJS, REST APIs, OpenAPI
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **WhatsApp**: Interakt API

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

```bash
# Clone and install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Start infrastructure (PostgreSQL, Redis, MinIO)
npm run docker:up

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Start development servers
npm run dev
```

### Environment Variables

Copy `.env.example` files in both `backend/` and `frontend/` directories and configure:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Project Structure

```
clinic-crm/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
├── docker-compose.yml
└── package.json      # Monorepo scripts
```

## User Roles

| Role | Access |
|------|--------|
| SUPER_ADMIN | Platform-wide access |
| CLINIC_ADMIN | Full clinic management |
| DOCTOR | Patient records, schedule |
| PATIENT | Booking, profile, feedback |

## Core Features

- Multi-tenant clinic management
- Real-time appointment booking
- Medical records with attachments
- WhatsApp notifications via Interakt
- Smart feedback routing (Google Review protection)
- Audit logging for compliance

## License

Private - All rights reserved
