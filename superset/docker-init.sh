#!/bin/bash
set -e

export SUPERSET_HOME=/app/superset_home
mkdir -p "$SUPERSET_HOME"

echo "🚀 Starting Superset"

# Run DB migrations (safe with external DB)
superset db upgrade || true

# Create admin only if it doesn't already exist
superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname User \
  --email admin@example.com \
  --password admin \
  || echo "ℹ️ Admin already exists"

# Initialize roles, perms, examples (idempotent)
superset init || true

# Start Superset using official entrypoint
exec /app/docker/entrypoints/run-server.sh
