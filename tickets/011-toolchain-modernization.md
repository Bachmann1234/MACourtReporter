# 011 — Toolchain modernization: Biome + Vitest + tsconfig

**Status:** DONE
**Area:** toolchain / hygiene
**Size:** M
**Order:** FIRST (foundation, before functional tickets — see README build order)

## Why
Everything is 2–4 majors behind and the dev tooling is heavy: ESLint + Prettier
+ ~12 plugins, plus Jest + ts-jest. This is a pure-tooling, no-behavior-change
pass done **upfront** so every later diff is clean (no writing code under ESLint
then reformatting under Biome). Coupled dependency removals are NOT here — they
ride with their feature tickets (decorators -> #007, twit -> #004, express ->
#008).

## Lint + format: Biome (replaces ESLint + Prettier)
- Add `@biomejs/biome` (single tool: format + lint + import sorting).
- Remove: `eslint`, `prettier`, `@typescript-eslint/*` (x2),
  `eslint-config-airbnb-typescript`, `eslint-config-prettier`, and all
  `eslint-plugin-*` (import, jest, react, react-hooks, jsx-a11y, promise,
  standard, eslint-comments). ~14 pkgs -> 1.
- Delete `.eslintrc.js`, `.eslintignore`, `.prettierrc`; add `biome.json`.
- Update `lint`/`format` npm scripts to `biome check` / `biome format`.
- Note tradeoff: Biome's type-aware lint rules aren't at full
  `typescript-eslint` parity; `tsc --strict` (already run) covers type-level
  issues. Acceptable for a ~10-file CLI.

## Test: Vitest (replaces Jest + ts-jest)
- Add `vitest`; remove `jest`, `ts-jest`, `jest-environment-node`,
  `@types/jest`, `jest.config.js`.
- Port the existing tests (Jest API is largely compatible — mostly imports +
  config). Native TS/ESM, so no ts-jest transform config.
- Update `test` script to `vitest run --coverage`.
- (Zero-dep alternative considered: built-in `node:test`. Rejected — existing
  suite uses Jest `expect`/mocking; Vitest port is far cheaper.)

## Version bumps (routine, no design decisions)
- `typescript` 4.8 -> 6.x
- `cheerio` rc.3 -> 1.2 (stable)
- `pino` 6 -> 10
- unify `@types/node` (currently pinned at BOTH ^8 and ^18 — remove the ^8) to
  match the chosen Node (#005).

## tsconfig
- Bump `target` from `es6` to match the Node runtime (#005). DONE — now extends
  `@tsconfig/node22` (target `es2022`).
- Review the unusual `baseUrl: src` + `paths: {"*": ["*"]}` — likely removable.
  DONE — removed; nothing relied on them (all imports are relative).
- (Decorator flags removed in #007 with the TypeORM drop, not here.)
- NOTE: dropped the explicit `module`/`moduleResolution` overrides — now inherits
  `nodenext`/`node16` from `@tsconfig/node22`. Emit stays CommonJS (no
  `type: module` in package.json). This replaces the project's TS6-deprecated
  classic `node` resolution, so no `ignoreDeprecations` escape hatch is needed.

## Done when
- `npm run lint`, `npm run format`, `npm test`, `npm run build` all pass on the
  new toolchain with no behavior change to the app. ✅ All green (10/10 tests).
