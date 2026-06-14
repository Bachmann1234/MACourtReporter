# 002 — Remove obsolete cert workaround

**Status:** DONE
**Area:** scraper / build
**Size:** S

## Problem
The repo bundles `DigiCertSHA2SecureServerCA.pem` and every npm script is
prefixed with `NODE_EXTRA_CA_CERTS=./dist/DigiCertSHA2SecureServerCA.pem` to
work around the MA site not serving a complete cert chain. This is now
obsolete and broken:
- The bundled cert **expired March 8, 2023**.
- It's the wrong intermediate anyway — the site rotated to
  "DigiCert Global G2 TLS RSA SHA256 2020 CA1".

## Findings
- The site now serves a **complete chain** (leaf -> G2 intermediate ->
  DigiCert Global Root G2, which is in Node's trust store).
- Verified plain `https.get('https://malegislature.gov/...')` validates with
  **no extra CA** — returns 200.

## Work
- Delete `DigiCertSHA2SecureServerCA.pem`.
- Remove the `NODE_EXTRA_CA_CERTS=...` prefix from all `package.json` scripts
  (`queryBills`, `updateBills`, `tweetBill`, `server`).
- Remove the cert copy from `copyStaticFiles.sh` if present.
- Delete the "Why do you have a cert in this repo?" section from `README.md`.

## Risk
Low. If the MA site ever reverts to an incomplete chain we'd need to restore
this, but the fix would be a fresh, valid intermediate — not the expired one.
