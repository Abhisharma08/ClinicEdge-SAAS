#!/bin/bash
set -euo pipefail

# ============================================
# ClinicEdge — Production Deploy Script
# Run on your Ubuntu VPS
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Pre-flight checks ──
command -v docker >/dev/null 2>&1 || err "Docker is not installed"
command -v docker compose >/dev/null 2>&1 || err "Docker Compose is not installed"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        warn ".env not found, copying .env.production → .env"
        cp .env.production .env
        warn "⚠️  Edit .env with your real values before continuing!"
        warn "   nano .env"
        exit 1
    else
        err "No .env or .env.production found. Create one first."
    fi
fi

# ── Validate critical vars ──
source .env
[ -z "${POSTGRES_PASSWORD:-}" ] && err "POSTGRES_PASSWORD is not set in .env"
[ -z "${JWT_SECRET:-}" ] && err "JWT_SECRET is not set in .env"
[ "${POSTGRES_PASSWORD}" = "CHANGE_ME_STRONG_PASSWORD_1" ] && err "You haven't changed the default POSTGRES_PASSWORD"
[ "${JWT_SECRET}" = "CHANGE_ME_JWT_SECRET" ] && err "You haven't changed the default JWT_SECRET"

log "Environment validated"

# ── Build & Deploy ──
log "Pulling latest base images..."
docker compose -f docker-compose.prod.yml pull postgres redis minio 2>/dev/null || true

log "Building application images..."
docker compose -f docker-compose.prod.yml build --no-cache

log "Starting services..."
docker compose -f docker-compose.prod.yml up -d

log "Waiting for services to be healthy..."
sleep 10

# ── Health check ──
echo ""
echo "════════════════════════════════════════════════"
echo "  Service Status"
echo "════════════════════════════════════════════════"
docker compose -f docker-compose.prod.yml ps

echo ""
VPS_IP=$(hostname -I | awk '{print $1}')
log "🚀 ClinicEdge is running!"
echo ""
echo "  Frontend:  http://${VPS_IP}"
echo "  Backend:   http://${VPS_IP}:3001"
echo "  MinIO UI:  http://${VPS_IP}:9001"
echo ""
echo "  Useful commands:"
echo "    View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "    Stop:          docker compose -f docker-compose.prod.yml down"
echo "    Restart:       docker compose -f docker-compose.prod.yml restart"
echo "    Rebuild:       docker compose -f docker-compose.prod.yml up -d --build"
echo ""
