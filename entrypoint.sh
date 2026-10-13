#!/bin/sh
set -e
npx prisma db push --skip-generate
npx prisma db execute --file prisma/sql/audit_immutable.sql --schema prisma/schema.prisma
if [ "$SEED_DEMO" = "true" ]; then node dist/prisma/seed.js; fi
exec node dist/src/main.js
