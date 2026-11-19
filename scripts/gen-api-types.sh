#!/bin/sh
# Regenerates TypeScript types from the backend OpenAPI contracts (read-only access to the backend repo).
set -eu
contracts="${BACKEND_CONTRACTS:-../diploma-growpath-backend/contracts/openapi}"
out="src/shared/api/schema"
mkdir -p "$out"
for name in commerce entitlement plant-care expert-consultation; do
  npx openapi-typescript "$contracts/$name.yaml" -o "$out/$name.d.ts"
done
