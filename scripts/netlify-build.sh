#!/usr/bin/env bash
set -euo pipefail
echo "🔧 Detectando gerenciador de pacotes..."
if [ -f pnpm-lock.yaml ]; then
  corepack enable || true
  corepack prepare pnpm@latest --activate || true
  pnpm install --frozen-lockfile
  pnpm build
elif [ -f yarn.lock ]; then
  corepack enable || true
  corepack prepare yarn@stable --activate || true
  yarn install --frozen-lockfile
  yarn build
elif [ -f bun.lockb ] && command -v bun >/dev/null 2>&1; then
  bun install
  bun run build
else
  npm ci --no-audit --no-fund || npm install
  npm run build
fi
