# 005 — Node 18 is EOL; upgrade runtime

**Status:** DONE
**Area:** hygiene / infra
**Size:** S

## Problem
Node 18 reached end-of-life (April 2025). Pinned in several places:
- `Dockerfile` -> `FROM node:18`
- `.github/workflows/verify.yaml` -> `node-version: '18.x'`
- `package.json` -> `"engines": { "node": "18.x" }`
- `@tsconfig/node18`, `@types/node` (mixed `^8` and `^18` — also messy)

## Work
- Move to Node 20 LTS or 22 LTS across Dockerfile, CI, and `engines`.
- Bump `@tsconfig/nodeXX` and unify `@types/node`.
- Re-run build + tests on the new runtime.

## Notes
- Not blocking the scraper/Bluesky revival, but should land before redeploying
  to Fly.
- Coordinate with #006 (TypeORM) since both touch build/runtime.
