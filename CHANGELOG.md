# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.6] - 2026-10-31

- feat(dashboard): align tenant data cutoff with last charged month (#825)
- test: cover hooks, queries and import paths
- test(ui): cover sortable headers, users list and chart interactions
- fix(charts): keep tooltip inside chart on narrow screens
- chore(deps): update dependency lucide-react to v1.63.0 (#822)

## [0.8.5] - 2026-10-31

- fix(charges): show quantities with a Polish decimal comma
- test(e2e): expect Polish share format and re-record dashboard baselines
- docs(openspec): record review fixes in specs
- test(e2e): load scroll and name-sort test SQL from seed files
- test(dashboard): cover a previous month outside the history window
- fix(api): reject malformed settings JSON and parallelise the HOA financial summary
- fix(admin): avoid stale assignment options and refresh races in infinite lists
- fix(pdf): use the local date and keep same-label apartments of different HOAs apart
- fix(apartments): sort and display shares from a database ratio
- feat(import): accept suffixed and multiple txt files per kind
- feat(admin): add sortable table view and move list filtering to the database
- feat(admin): replace manual pagination with infinite scrolling
- feat: notice PDF and admin year grouping
- feat(dashboard): limit tenant history to an admin-configured window
- fix(import): ignore rounding-only decimal changes
- chore(deps): update semgrep/semgrep docker tag to v1.183.0 (#821)
- chore(deps): update pnpm to v12.16.1 (#818)

## [0.8.4] - 2026-10-30

- fix(admin): require double confirmation for inactive apartments
- refactor: share period, chart and balance helpers
- feat(dashboard): per-apartment balance and charge charts
- feat(import): warn about skipped records
- fix(import): skip cross-year check against a partial previous year
- fix(import): match cross-file charges by owner and apartment
- fix(payments): include opening balance in Razem totals
- chore: update openspec
- chore(deps): update pnpm to v12.16.0 (#816)

## [0.8.3] - 2026-10-30

- docs(readme): drop the performance and visual test sections (#814)
- perf: faster seeding, more payments and TypeScript k6 scripts (#813)
- test(perf): cover HOA drill-down, search and payment details (#812)
- perf(admin): paginate admin apartment lists
- feat(perf): seed production-sized dataset and vary k6 targets

## [0.8.2] - 2026-10-29

- test: raise coverage thresholds to 95%
- test(perf): ramp every scenario through load steps
- refactor: split long pages, modules and e2e specs
- fix: label icon buttons, check turnstile first and use the server year
- test: replace mock-only tests and share payment fixtures
- refactor: share UI helpers and DTO types across the app
- fix: correct polish plurals, admin credential checks and apartment sort
- refactor: share error message, admin check and app constants
- refactor: remove dead code and rename management components to kebab-case
- chore(deps): update dependency grafana/k6 to v2
- test(ui): cover remaining component branches
- refactor(charts): extract tooltip and axis formatters
- test(admin): cover users, management and import components
- test(api): cover validation, sorting and failure branches of routes
- test(lib): cover parser, importer, auth and utility edge cases
- test: measure coverage of all source files
- test(ui): cover verification banner, payments summary, layout and providers
- test: cover proxy, auth wiring, cron jobs, prisma client and fonts
- test(api): cover stats, turnstile config, verification and auth routes
- test(db): cover email verification, apartment and user queries
- test(otel): cover metrics, instrumentation and tracing helpers
- refactor: move page data shaping into tested modules
- test(perf): add k6 performance tests and CI job (#806)
- test: cover charges lists, payment year row and PDF buttons
- test(e2e): render visual snapshots with grayscale text antialiasing
- feat(ui): simplify charges lists and notifications card
- test(e2e): add visual regression tests and run E2E on mobile
- fix(dashboard): prevent horizontal overflow of long addresses on mobile

## [0.8.1] - 2026-10-28

- ci: bump version to v0.8.0
- fix(docker): run prisma generate with --liftoff-only
- chore(deps): update node.js to v26
- chore(deps): update node.js to v24.22.2 (#801)
- chore(deps): update node.js to v26 (#799)

## [0.8.0] - 2026-10-28

- fix(docker): run prisma generate with --liftoff-only
- chore(deps): update node.js to v26
- chore(deps): update node.js to v24.22.2 (#801)
- chore(deps): update node.js to v26 (#799)

## [0.7.10] - 2026-10-28

- chore(deps): pin dependencies (#793)
- chore(deps): update dependency @types/node to v26
- chore(deps): lock file maintenance (#798)
- chore(deps): pin dependencies (#796)
- refactor(renovate): extend shared preset
- chore(renovate): add minimumReleaseAge of 1 day (#792)
- chore(deps): update dependency lucide-react to v1.62.0 (#791)
- chore(deps): update dependency import-in-the-middle to v3.5.3 (#789)
- chore(deps): update grafana/otel-lgtm docker tag to v0.38.1 (#790)
- chore(deps): update nextjs monorepo to v16.4.3 (#788)
- chore(deps): update grafana/otel-lgtm docker tag to v0.38.0 (#787)
- chore(deps): update dependency dotenv to v18.0.9 (#786)
- chore(deps): update dependency nodemailer to v10.2.1 (#785)
- refactor: use next router instead of window.location for internal navigation
- ci: build docker image in parallel and cache lint results
- chore(deps): update pnpm to v12.15.0 (#784)
- chore(deps): update semgrep/semgrep docker tag to v1.182.1 (#782)

## [0.7.9] - 2026-10-21

- fix(docker): add forwarded-parse and run e2e against the Docker image (#781)
- chore(deps): update node.js to v24.22.1 (#777)
- chore(deps): update dependency nodemailer to v10.2.0 (#780)
- chore(deps): update dependency @marsidev/react-turnstile to v1.6.3 (#779)

## [0.7.8] - 2026-10-21

- chore(deps): update opentelemetry-js monorepo to v3
- chore(deps): update dependency vite to v8.3.5 (#775)
- chore(deps): update opentelemetry-js-contrib monorepo (#770)
- chore(deps): update dependency lucide-react to v1.61.0 (#776)
- chore(deps): update opentelemetry-js monorepo (#768)
- chore(deps): update semgrep/semgrep docker tag to v1.182.0 (#771)
- chore(deps): update dependency lucide-react to v1.60.0 (#767)
- chore(deps): update dependency nodemailer to v10.1.7 (#766)
- chore(deps): update dependency nodemailer to v10.1.6 (#765)
- chore(deps): update dependency lucide-react to v1.59.0 (#764)
- chore(deps): update pnpm to v12.14.0 (#763)
- chore(deps): update dependency nodemailer to v10.1.2 (#761)
- chore(deps): update dependency eslint to v10.13.0 (#762)
- chore(deps): update grafana/otel-lgtm docker tag to v0.37.0 (#760)
- chore(deps): update dependency lucide-react to v1.58.0 (#759)
- chore(deps): update opentelemetry-js-contrib monorepo (#758)
- chore(deps): update nextjs monorepo to v16.4.2 (#757)
- chore(deps): update dependency prisma to v7.10.1 (#756)
- chore(deps): update dependency @prisma/adapter-pg to v7.10.1 (#754)
- chore(deps): update dependency @prisma/client to v7.10.1 (#755)
- chore(deps): update vitest monorepo to v5.0.5 (#753)
- chore(deps): update dependency jsdom to v30.1.3 (#752)
- chore(deps): update node.js to v24.22.0 (#750)
- chore(deps): update semgrep/semgrep docker tag to v1.181.0 (#751)
- chore(deps): update nextjs monorepo to v16.4.1 (#748)
- chore(deps): update react monorepo to v19.3.1 (#749)
- chore(deps): update dependency dotenv to v18.0.8 (#747)
- chore(deps): update dependency @playwright/test to v1.64.1 (#746)
- chore(deps): update dependency lucide-react to v1.57.0 (#745)
- chore(deps): update dependency nodemailer to v10.1.1 (#744)
- chore(deps): update dependency eslint-plugin-prettier to v5.5.7 (#743)
- chore(deps): update dependency @testing-library/user-event to v14.6.8 (#741)
- chore(deps): update dependency lucide-react to v1.56.0 (#742)
- chore(deps): update radix-ui-primitives monorepo (#740)
- chore(deps): update vitest monorepo to v5.0.4 (#739)
- chore(deps): update radix-ui-primitives monorepo (#737)
- chore(deps): update dependency @marsidev/react-turnstile to v1.6.2 (#736)
- chore(deps): update pnpm to v12.11.2 (#735)
- chore(deps): update dependency nodemailer to v10.1.0 (#734)
- chore(deps): update dependency prettier to v3.9.10 (#732)
- chore(deps): update dependency lucide-react to v1.55.0 (#733)
- chore(deps): update dependency dotenv to v18.0.7 (#731)
- chore(deps): update dependency lucide-react to v1.54.0 (#729)
- chore(deps): update grafana/otel-lgtm docker tag to v0.36.0 (#730)
- chore(deps): update dependency vite to v8.3.4 (#728)
- chore(deps): update dependency lucide-react to v1.53.0 (#727)
- chore(deps): update semgrep/semgrep docker tag to v1.180.0 (#726)
- chore(deps): update dependency @playwright/test to v1.64.0 (#725)
- chore(deps): update dependency nodemailer to v10.0.16 (#723)
- chore(deps): update pnpm to v12.10.1 (#724)
- chore(deps): update opentelemetry-js-contrib monorepo (#722)
- chore(deps): update dependency dotenv to v18.0.6 (#721)
- chore(deps): update opentelemetry-js monorepo (#720)
- chore(deps): update nextjs monorepo to v16.4.0 (#719)
- chore(deps): update dependency vite to v8.3.3 (#718)
- chore(deps): update dependency nodemailer to v10.0.15 (#716)
- chore(deps): update radix-ui-primitives monorepo (#717)
- chore(deps): update dependency eslint-plugin-playwright to v2.12.1 (#715)
- chore(deps): update dependency @vitejs/plugin-react to v6.1.2 (#714)
- chore(deps): update dependency pino-pretty to v13.2.0 (#713)
- chore(deps): update dependency lucide-react to v1.52.0 (#712)
- chore(deps): update dependency jsdom to v30.1.2 (#711)
- chore(deps): update pnpm to v12.9.1 (#710)
- chore(deps): update dependency nodemailer to v10.0.14 (#709)
- chore(deps): update dependency lucide-react to v1.51.0 (#708)
- chore(deps): update dependency eslint to v10.12.0 (#707)
- chore(deps): update dependency pino to v10.4.0 (#706)
- chore(deps): update dependency lucide-react to v1.50.0 (#704)
- chore(deps): update grafana/otel-lgtm docker tag to v0.35.0 (#705)
- chore(deps): update dependency @types/node to v25.9.9 (#702)
- chore(deps): update semgrep/semgrep docker tag to v1.179.0 (#703)
- chore(deps): update dependency vite to v8.3.2 (#701)
- chore(deps): update nextjs monorepo to v16.3.8 (#700)
- chore(deps): update dependency dotenv to v18.0.5 (#698)
- chore(deps): update dependency import-in-the-middle to v3.5.2 (#699)
- chore(deps): update dependency pg to v8.23.1 (#696)
- chore(deps): update vitest monorepo to v5.0.3 (#697)
- chore(deps): update dependency nodemailer to v10.0.13 (#695)
- chore(deps): update dependency lucide-react to v1.49.0 (#694)
- chore(deps): update pnpm to v12.8.1 (#693)
- chore(deps): update nextjs monorepo to v16.3.7 (#692)
- chore(deps): update dependency nodemailer to v10.0.12 (#691)
- chore(deps): update dependency nodemailer to v10.0.11 (#690)
- chore(deps): update pnpm to v12.6.0 (#682)
- chore(deps): update dependency lint-staged to v17.6.0 (#689)
- chore(deps): update dependency dotenv to v18.0.4 (#688)
- chore(deps): update vitest monorepo to v5.0.2 (#686)
- chore(deps): update grafana/otel-lgtm docker tag to v0.34.0 (#687)
- chore(deps): update dependency vite to v8.3.1 (#685)
- chore(deps): update dependency lucide-react to v1.48.0 (#684)
- chore(deps): update semgrep/semgrep docker tag to v1.178.0 (#683)
- chore(deps): update dependency prettier to v3.9.9 (#681)
- chore(deps): update nextjs monorepo to v16.3.6 (#680)
- chore(deps): update dependency dotenv to v18.0.3 (#679)
- chore(deps): update dependency jsdom to v30.1.1 (#678)
- chore(deps): update dependency dotenv to v18.0.2 (#677)
- chore(deps): update dependency tsx to v4.23.15 (#676)
- chore(deps): update dependency tsx to v4.23.14 (#675)
- chore(deps): update pnpm to v12.5.1 (#674)
- chore(deps): update dependency jsdom to v30.1.0 (#665)
- chore(deps): update dependency dotenv to v18.0.1 (#672)
- chore(deps): update dependency @types/node to v25.9.8 (#671)
- chore(deps): update dependency eslint to v10.11.0 (#670)
- chore(deps): update grafana/otel-lgtm docker tag to v0.33.1 (#669)
- chore(deps): update dependency dotenv to v18
- chore(deps): update dependency prettier to v3.9.8 (#667)
- chore(deps): update dependency lucide-react to v1.47.0 (#666)
- chore(deps): update dependency prettier to v3.9.7 (#664)
- chore(deps): update dependency @types/nodemailer to v8.0.2 (#663)
- chore(deps): update dependency @types/node to v25.9.7 (#662)
- chore(deps): update pnpm to v12.4.2 (#660)
- chore(deps): update vitest monorepo to v5.0.1 (#661)
- chore(deps): update dependency nodemailer to v10.0.10 (#659)
- chore(deps): update dependency eslint-plugin-playwright to v2.12.0 (#657)
- chore(deps): update dependency lucide-react to v1.46.0 (#658)
- chore(deps): update dependency tailwind-merge to v3.7.0 (#656)
- chore(deps): update dependency nodemailer to v10.0.9 (#655)
- chore(deps): update pnpm to v12.4.1 (#654)
- chore(deps): update nextjs monorepo to v16.3.5 (#650)
- chore(deps): update grafana/otel-lgtm docker tag to v0.33.0 (#653)
- chore(deps): update dependency lucide-react to v1.45.0 (#652)
- chore(deps): update dependency nodemailer to v10.0.8 (#651)
- chore(deps): update dependency nodemailer to v10.0.7 (#649)
- chore(deps): update dependency import-in-the-middle to v3.5.1 (#647)
- chore(deps): update dependency nodemailer to v10.0.6 (#648)
- chore(deps): update node.js to v24.21.0
- chore(deps): update semgrep/semgrep docker tag to v1.177.0 (#646)
- chore(deps): update dependency lint-staged to v17.5.1 (#644)
- chore(deps): update dependency vite to v8.3.0 (#645)
- chore(deps): update dependency lucide-react to v1.44.0 (#643)
- chore(deps): update dependency nodemailer to v10.0.3 (#642)
- chore(deps): update dependency nodemailer to v10.0.2 (#640)
- chore(deps): update dependency @types/node to v25.9.6 (#639)
- chore(deps): update react monorepo to v19.3.0 (#638)
- chore(deps): update node.js to v24.21.0 (#637)
- chore(deps): update dependency import-in-the-middle to v3.5.0 (#636)
- chore(deps): update dependency lucide-react to v1.43.0 (#635)
- chore(deps): update dependency lucide-react to v1.42.0 (#634)
- chore(deps): update dependency nodemailer to v10.0.1 (#633)
- chore(deps): update pnpm to v12
- chore(deps): update dependency lint-staged to v17.5.0 (#631)
- chore(deps): update dependency @playwright/test to v1.63.0 (#630)
- chore(deps): update dependency nodemailer to v10
- chore(deps): update semgrep/semgrep docker tag to v1.176.1 (#629)
- chore(deps): update dependency eslint to v10.10.0 (#627)
- chore(deps): update dependency lucide-react to v1.41.0 (#626)
- chore(deps): update grafana/otel-lgtm docker tag to v0.32.1 (#625)
- chore(deps): update dependency @eslint/compat to v2.1.1 (#624)
- chore(deps): update vitest monorepo to v5
- chore(deps): update dependency @types/react-dom to v19.2.7 (#621)
- chore(deps): update dependency lucide-react to v1.40.0 (#622)
- chore(deps): update dependency @testing-library/user-event to v14.6.7 (#620)
- chore(deps): update dependency nodemailer to v9.1.1 (#618)
- chore(deps): update semgrep/semgrep docker tag to v1.176.0 (#619)
- chore(deps): update dependency lucide-react to v1.39.0 (#617)
- chore(deps): update pnpm to v11.25.0 (#616)
- chore(deps): update opentelemetry-js-contrib monorepo (#615)
- chore(deps): update nextjs monorepo to v16.3.4 (#614)
- chore(deps): update opentelemetry-js monorepo (#613)
- chore(deps): update dependency nodemailer to v9.1.0 (#612)
- chore(deps): update dependency lucide-react to v1.38.0 (#611)
- chore(deps): update dependency import-in-the-middle to v3.4.0 (#610)
- chore(deps): update dependency tsx to v4.23.13 (#609)
- chore(deps): update dependency lucide-react to v1.37.0 (#608)

## [0.7.7] - 2026-08-29

- chore(deps): update node.js to v24.20.0
- chore(deps): update grafana/otel-lgtm docker tag to v0.32.0 (#607)
- chore(deps): update dependency lucide-react to v1.35.0 (#606)
- chore(deps): update dependency @vitejs/plugin-react to v6.1.1 (#605)
- chore(deps): update dependency @react-pdf/renderer to v4.9.0 (#603)
- chore(deps): update dependency nodemailer to v9.0.6 (#602)
- chore(deps): update dependency @testing-library/react to v16.3.3 (#601)
- chore(deps): update dependency lint-staged to v17.4.1 (#600)
- chore(deps): update dependency @marsidev/react-turnstile to v1.6.1 (#599)
- chore(deps): update semgrep/semgrep docker tag to v1.175.0 (#598)
- chore(deps): update node.js to v24.20.0 (#597)
- chore(deps): update nextjs monorepo to v16.3.3 (#596)
- chore(deps): update pnpm to v11.24.0 (#595)
- chore(deps): update dependency prisma to v7.10.0 (#594)
- chore(deps): update dependency @prisma/client to v7.10.0 (#593)
- chore(deps): update dependency @prisma/adapter-pg to v7.10.0 (#592)
- chore(deps): update dependency eslint to v10.9.1 (#591)
- chore(deps): update dependency lucide-react to v1.34.0 (#590)
- chore(deps): update dependency @react-pdf/renderer to v4.8.1 (#589)
- chore(deps): update dependency @react-pdf/renderer to v4.8.0 (#588)
- chore(deps): update dependency @types/react-dom to v19.2.5 (#587)
- chore(deps): update pnpm to v11.23.0 (#586)
- chore(deps): update dependency @react-pdf/renderer to v4.7.0 (#585)
- chore(deps): update dependency @testing-library/user-event to v14.6.6 (#584)
- chore(deps): update dependency eslint to v10.9.0 (#583)
- chore(deps): update grafana/otel-lgtm docker tag to v0.31.0 (#582)
- chore(deps): update nextjs monorepo to v16.3.2 (#581)
- chore(deps): update semgrep/semgrep docker tag to v1.174.0 (#580)
- chore(deps): update dependency vite to v8.2.2 (#579)
- chore(deps): update dependency @vitejs/plugin-react to v6.1.0 (#578)
- chore(deps): update dependency lucide-react to v1.33.0 (#577)
- chore(deps): update vitest monorepo to v4.1.11 (#576)
- chore(deps): update dependency lucide-react to v1.32.0 (#575)
- chore(deps): update dependency @testing-library/user-event to v14.6.5 (#574)
- chore(deps): update dependency @types/pg to v8.23.1 (#573)
- chore(deps): update dependency @types/pg to v8.23.0 (#572)
- chore(deps): update pnpm to v11.22.0 (#571)
- chore(deps): update dependency @react-pdf/renderer to v4.6.1 (#569)
- chore(deps): update grafana/otel-lgtm docker tag to v0.30.2 (#570)
- chore(deps): update nextjs monorepo to v16.3.1 (#568)
- chore(deps): update postgres docker tag to v18.6 (#567)
- chore(deps): update semgrep/semgrep docker tag to v1.173.0 (#566)
- chore(deps): update dependency @testing-library/user-event to v14.6.4 (#565)
- chore(deps): update dependency @marsidev/react-turnstile to v1.6.0 (#564)
- chore(deps): update dependency tsx to v4.23.12 (#563)
- chore(deps): update dependency @testing-library/jest-dom to v7.0.1 (#562)
- chore(deps): update pnpm to v11.21.0 (#561)
- chore(deps): update dependency lucide-react to v1.31.0 (#560)
- chore(deps): update dependency @react-pdf/renderer to v4.6.0 (#559)
- chore(deps): update dependency pg to v8.23.0 (#558)
- chore(deps): update dependency eslint to v10.8.1 (#557)
- chore(deps): update dependency @types/pg to v8.21.0 (#556)
- chore(deps): update dependency tsx to v4.23.11 (#555)
- chore(deps): update dependency lucide-react to v1.30.0 (#554)
- chore(deps): update dependency nodemailer to v9.0.5 (#552)
- chore(deps): update grafana/otel-lgtm docker tag to v0.30.1 (#553)
- chore(deps): update dependency tsx to v4.23.10 (#551)
- chore(deps): update dependency vite to v8.2.1 (#550)
- chore(deps): update dependency lucide-react to v1.29.0 (#549)
- chore(deps): update dependency tsx to v4.23.9 (#548)
- chore(deps): update dependency tsx to v4.23.8 (#547)
- chore(deps): update dependency tsx to v4.23.7 (#546)
- chore(deps): update dependency @marsidev/react-turnstile to v1.5.5 (#545)
- chore(deps): update dependency tsx to v4.23.6 (#544)
- chore(deps): update dependency @types/pg to v8.20.4 (#543)
- chore(deps): update nextjs monorepo to v16.3.0 (#539)
- chore(deps): update node.js to v24.19.0
- chore(deps): update dependency nodemailer to v9.0.4 (#542)
- chore(deps): update dependency @testing-library/user-event to v14.6.3 (#541)
- chore(deps): update pnpm to v11.20.0 (#538)
- chore(deps): update node.js to v24.19.0 (#537)
- chore(deps): update dependency tsx to v4.23.5 (#536)
- chore(deps): update node.js to v24.18.1
- chore(deps): update dependency tsx to v4.23.4 (#535)
- chore(deps): update dependency @types/pg to v8.20.3 (#534)
- chore(deps): update dependency import-in-the-middle to v3.3.3 (#533)
- chore(deps): update dependency @types/pg to v8.20.2 (#532)
- chore(deps): update dependency @types/pg to v8.20.1 (#531)
- chore(deps): update grafana/otel-lgtm docker tag to v0.30.0 (#530)
- chore(deps): update dependency lint-staged to v17.3.0 (#529)
- chore(deps): update react monorepo (#528)
- chore(deps): update dependency @playwright/test to v1.62.1 (#526)
- chore(deps): update dependency vite to v8.2.0 (#525)
- chore(deps): update dependency @vitejs/plugin-react to v6.0.5 (#524)
- chore(deps): update dependency lucide-react to v1.28.0 (#523)
- chore(deps): update node.js to v24.18.1 (#522)
- chore(deps): update pnpm to v11.18.0 (#521)
- chore(deps): update dependency jsdom to v30.0.1 (#520)
- fix: add @typescript/typescript6
- chore(deps): update dependency typescript to v7
- chore(deps): update semgrep/semgrep docker tag to v1.172.0 (#519)
- chore(deps): update prisma monorepo to v7.9.1 (#518)
- chore(deps): update dependency @marsidev/react-turnstile to v1.5.4 (#517)
- chore(deps): update dependency jsdom to v30
- chore(deps): update dependency eslint-plugin-playwright to v2.11.0 (#515)
- chore(deps): update dependency lucide-react to v1.27.0 (#514)
- chore(deps): update nextjs monorepo to v16.2.12 (#513)
- chore(deps): update dependency recharts to v3.10.1 (#512)
- chore(deps): update radix-ui-primitives monorepo (#511)
- chore(deps): update dependency @playwright/test to v1.62.0 (#510)
- chore(deps): update dependency eslint to v10.8.0 (#509)
- chore(deps): update radix-ui-primitives monorepo (#508)
- chore(deps): update grafana/otel-lgtm docker tag to v0.29.2 (#507)
- chore(deps): update opentelemetry-js-contrib monorepo (#506)
- chore(deps): update pnpm to v11.17.0 (#505)
- chore(deps): update dependency lint-staged to v17.2.0 (#504)
- chore(deps): update dependency lucide-react to v1.26.0 (#503)

## [0.7.6] - 2026-07-23

- chore: pin patch pnpm version in release workflow
- chore(deps): update radix-ui-primitives monorepo and remove forwardRef from UI components
- chore(deps): update semgrep/semgrep docker tag to v1.171.0 (#502)
- chore(deps): update pnpm to v11.16.0 (#500)
- chore(deps): update react monorepo to v19.2.8 (#499)
- chore(deps): update dependency lint-staged to v17.1.1 (#496)
- chore(deps): update dependency @vitejs/plugin-react to v6.0.4 (#495)
- chore(deps): update semgrep/semgrep docker tag to v1.170.1 (#494)
- chore(deps): update opentelemetry-js monorepo (#493)
- chore(deps): update nextjs monorepo to v16.2.11 (#492)
- chore(deps): update dependency prettier to v3.9.6 (#489)
- chore(deps): update dependency next-auth to v5.0.0-beta.32 (#487)
- chore(deps): update dependency recharts to v3.10.0 (#488)
- chore(deps): update dependency @testing-library/jest-dom to v7
- chore(deps): update dependency import-in-the-middle to v3.3.2 (#486)
- chore(deps): update dependency @auth/prisma-adapter to v2.11.3 (#485)
- chore(deps): update prisma monorepo to v7.9.0 (#483)
- chore(deps): update radix-ui-primitives monorepo (#482)
- chore(deps): update pnpm to v11.15.1 (#481)
- chore(deps): update pnpm to v11.15.0 (#480)
- chore(deps): update dependency lint-staged to v17.1.0 (#479)
- chore(deps): update pnpm to v11.14.0 (#478)
- chore(deps): update grafana/otel-lgtm docker tag to v0.29.1 (#477)
- chore(deps): update dependency eslint-plugin-simple-import-sort to v14
- chore(deps): update dependency lucide-react to v1.25.0 (#476)
- chore(deps): update tailwindcss monorepo to v4.3.3 (#474)
- chore(deps): update dependency vite to v8.1.5 (#473)
- chore(deps): update pnpm to v11.13.1 (#472)
- chore(deps): update semgrep/semgrep docker tag to v1.170.0 (#471)
- chore(deps): update actions/setup-node action to v7
- chore(deps): update pnpm to v11.12.0 (#468)
- chore(deps): update grafana/otel-lgtm docker tag to v0.29.0 (#469)
- chore(deps): update dependency tsx to v4.23.1 (#467)
- chore: update dockerfile
- chore: add .node-version
- chore: pin versions
- chore(deps): update dependency eslint to v10.7.0 (#466)
- chore(deps): update dependency @opentelemetry/semantic-conventions to v1.43.0 (#465)
- chore(deps): update dependency prettier to v3.9.5 (#464)
- chore(deps): update dependency lucide-react to v1.24.0 (#463)
- chore(deps): update dependency vite to v8.1.4 (#462)
- chore(deps): update semgrep/semgrep docker tag to v1.169.0 (#461)
- chore(deps): update dependency @types/node to v25.9.5 (#459)
- chore(deps): update dependency import-in-the-middle to v3.3.1 (#458)
- chore(deps): update radix-ui-primitives monorepo (#457)
- chore(deps): update dependency @opentelemetry/semantic-conventions to v1.42.0 (#456)
- chore(deps): update vitest monorepo to v4.1.10 (#455)
- chore(deps): update dependency eslint-plugin-playwright to v2.10.5 (#454)
- chore(deps): update dependency node-cron to v4.6.0 (#453)

## [0.7.5] - 2026-07-05

- refactor: small cleanup
- feat: improve data import and display
- chore: add more opencode skills
- chore: update openspec
- chore(deps): update dependency prettier to v3.9.4 (#450)
- chore(deps): update dependency tsx to v4.23.0 (#451)
- chore(deps): update dependency lucide-react to v1.23.0 (#449)
- chore(deps): update dependency eslint to v10.6.0 (#447)
- chore(deps): update dependency import-in-the-middle to v3.3.0 (#448)
- chore(deps): update opentelemetry-js monorepo (#437)
- chore(deps): update tailwindcss monorepo to v4.3.2 (#446)
- chore(deps): update radix-ui-primitives monorepo (#445)
- chore(deps): update nextjs monorepo to v16.2.10 (#436)
- chore(deps): update dependency vite to v8.1.3 (#444)
- chore(deps): update dependency recharts to v3.9.2 (#443)
- chore(deps): update opentelemetry-js-contrib monorepo (#438)
- chore(deps): update dependency recharts to v3.9.1 (#442)
- chore(deps): update dependency nodemailer to v9.0.3 (#441)
- chore(deps): update dependency iconv-lite to v0.7.3 (#440)
- chore(deps): update dependency @playwright/test to v1.61.1 (#439)
- chore(deps): update node.js to v24.18.0 (#434)
- chore(deps): update semgrep/semgrep docker tag to v1.168.0 (#435)
- chore(deps): update dependency vite to v8.1.0 (#433)
- chore(deps): update dependency recharts to v3.9.0 (#432)
- chore(deps): update dependency @vitejs/plugin-react to v6.0.3 (#431)
- chore(deps): update dependency import-in-the-middle to v3.2.0 (#430)
- chore(deps): update dependency node-cron to v4.5.0 (#429)
- chore(deps): update dependency lint-staged to v17.0.8 (#428)

## [0.7.4] - 2026-06-19

- chore(deps): update react monorepo (#427)
- chore(deps): update eslint to v10
- chore(deps): update dependency @types/node to v25.9.4 (#423)
- chore(deps): update dependency pg to v8.22.0 (#422)
- chore(deps): update actions/checkout action to v7
- chore(deps): update node.js to v24.17.0 (#420)
- chore(deps): update lucide monorepo to v1.21.0 (#419)
- chore(deps): update dependency node-cron to v4.4.1 (#418)
- chore(deps): update dependency node-cron to v4.4.0 (#417)
- chore(deps): update dependency node-cron to v4.3.0 (#416)
- chore(deps): update dependency import-in-the-middle to v3.1.0 (#415)
- chore(deps): update dependency nodemailer to v9.0.1 (#414)
- chore: set minimumReleaseAge to 0
- chore: disable minimumReleaseAgeStrict option
- chore(deps): update semgrep/semgrep docker tag to v1.167.0 (#413)
- chore(deps): update lucide monorepo to v1.20.0 (#412)
- chore(deps): update dependency nodemailer to v9
- chore(deps): update playwright monorepo to v1.61.0 (#409)
- chore(deps): update vitest monorepo to v4.1.9 (#408)
- chore(deps): update radix-ui-primitives monorepo (#407)
- chore(deps): update opentelemetry-js-contrib monorepo (#402)
- chore(deps): update opentelemetry-js monorepo (#401)
- chore(deps): update lucide monorepo to v1.18.0 (#405)
- chore(deps): update tailwindcss monorepo to v4.3.1 (#404)
- chore(deps): update semgrep/semgrep docker tag to v1.166.0 (#403)
- chore(deps): update dependency nodemailer to v8.0.11 (#400)
- chore(deps): update dependency @types/node to v25.9.3 (#399)
- chore(deps): update nextjs monorepo to v16.2.9 (#398)
- chore(deps): update dependency prettier to v3.8.4 (#397)
- chore(deps): update dependency import-in-the-middle to v3.0.2 (#396)
- chore(deps): update dependency @marsidev/react-turnstile to v1.5.3 (#395)
- chore(deps): update radix-ui-primitives monorepo (#394)
- chore(deps): update react monorepo to v19.2.17 (#393)
- chore(deps): update dependency @types/node to v25.9.2 (#392)
- chore(deps): update semgrep/semgrep docker tag to v1.165.0 (#391)
- chore(deps): update vitest monorepo to v4.1.8 (#390)
- chore(deps): update react monorepo (#389)
- chore(deps): update nextjs monorepo to v16.2.7 (#388)
- chore(deps): update dependency vite to v8.0.15 (#387)
- chore(deps): update dependency lint-staged to v17.0.6 (#385)
- chore(deps): update dependency tsx to v4.22.4 (#386)
- chore(deps): update dependency nodemailer to v8.0.10 (#384)
- chore(deps): update dependency lucide-react to v1.17.0 (#382)
- chore(deps): update dependency eslint-plugin-prettier to v5.5.6 (#383)
- chore: set explicit pnpm minimumReleaseAge
- chore(deps): update dependency nodemailer to v8.0.9 (#380)
- chore(deps): update semgrep/semgrep docker tag to v1.164.0 (#381)
- fix: docker entrypoint prisma migration
- chore: move recharts to dev dependencies

## [0.7.3] - 2026-05-26

- fix: release version workflow
- chore(deps): update vitest monorepo to v4.1.7 (#378)
- chore(deps): update dependency tsx to v4.22.2 (#368)
- chore(deps): update node.js to v24.16.0 (#379)
- chore(deps): update dependency pg to v8.21.0 (#367)
- chore(deps): update dependency nodemailer to v8.0.8 (#376)
- chore(deps): update dependency vite to v8.0.14 (#377)
- chore(deps): update dependency @types/node to v25.9.0 (#365)
- chore(deps): update dependency eslint-plugin-playwright to v2.10.4 (#375)
- chore(deps): update dependency @types/react to v19.2.15 (#374)
- chore(deps): update opentelemetry-js-contrib monorepo (#371)
- chore(deps): update opentelemetry-js monorepo (#370)
- chore(deps): update postgres docker tag to v18.4 (#372)
- chore(deps): update semgrep/semgrep docker tag to v1.163.0 (#373)
- chore(deps): update dependency lucide-react to v1.16.0 (#366)
- chore(deps): update grafana/otel-lgtm docker tag to v0.28.0 (#369)
- chore(deps): update vitest monorepo to v4.1.6 (#363)
- chore(deps): update dependency @playwright/test to v1.60.0 (#364)
- chore(deps): update dependency lint-staged to v17.0.5 (#361)
- chore(deps): update dependency eslint-plugin-playwright to v2.10.3 (#360)
- chore(deps): update dependency vite to v8.0.13 (#362)
- chore(deps): update dependency @vitejs/plugin-react to v6.0.2 (#359)
- fix: docker volume path
- chore(deps): update dependency tailwind-merge to v3.6.0
- chore(deps): update dependency vite to v8.0.12 (#358)
- chore(deps): update tailwindcss monorepo to v4.3.0 (#357)
- chore(deps): update dependency lint-staged to v17.0.4 (#354)
- chore(deps): update semgrep/semgrep docker tag to v1.162.0 (#355)
- chore(deps): update dependency lint-staged to v17
- chore(deps): update nextjs monorepo to v16.2.6 (#352)
- chore(deps): update dependency tailwind-merge to v3.6.0 (#353)
- chore(deps): update dependency @types/node to v25.6.2 (#350)
- chore(deps): update grafana/otel-lgtm docker tag to v0.27.1 (#351)
- chore(deps): update dependency vite to v8.0.11 (#349)
- chore(deps): update opentelemetry-js monorepo to ^0.217.0 (#347)
- chore(deps): update nextjs monorepo to v16.2.5 (#345)
- chore(deps): update opentelemetry-js-contrib monorepo (#348)
- chore(deps): update react monorepo to v19.2.6 (#346)
- chore(deps): update dependency @marsidev/react-turnstile to v1.5.2 (#343)
- chore(deps): update grafana/otel-lgtm docker tag to v0.27.0 (#342)

## [0.7.2] - 2026-05-01

- fix: import process db operations performance

## [0.7.1] - 2026-04-30

- fix: test coverage
- feat: add charts
- feat: add support for non-calculated sums
- chore: update openspec
- chore(deps): update dependency jsdom to v29.1.1 (#339)
- chore(deps): update opentelemetry-js-contrib monorepo (#338)
- chore(deps): update opentelemetry-js monorepo (#337)
- chore(deps): update dependency lucide-react to v1.14.0 (#336)
- chore(deps): update dependency lucide-react to v1.12.0 (#335)
- chore(deps): update dependency nodemailer to v8.0.7 (#334)
- chore(deps): update dependency jsdom to v29.1.0 (#333)
- chore(deps): update dependency @marsidev/react-turnstile to v1.5.1 (#332)
- chore(deps): update dependency lucide-react to v1.11.0 (#331)
- chore(deps): update dependency nodemailer to v8.0.6 (#330)
- chore(deps): update grafana/otel-lgtm docker tag to v0.26.0 (#329)
- chore(deps): update dependency lucide-react to v1.9.0 (#328)
- chore(deps): update dependency vite to v8.0.10 (#327)
- chore(deps): update semgrep/semgrep docker tag to v1.161.0 (#326)
- chore(deps): update prisma monorepo to v7.8.0 (#325)
- chore(deps): update aquasecurity/trivy-action action to v0.36.0 (#324)
- chore(deps): update tailwindcss monorepo to v4.2.4 (#322)
- chore(deps): update vitest monorepo to v4.1.5 (#323)
- chore(deps): update tailwindcss monorepo to v4.2.3 (#321)
- chore(deps): update dependency eslint-plugin-playwright to v2.10.2 (#319)
- chore(deps): update dependency vite to v8.0.9 (#320)
- chore(deps): update opentelemetry-js-contrib monorepo (#318)
- chore(deps): update opentelemetry-js monorepo (#317)
- chore(deps): update grafana/otel-lgtm docker tag to v0.25.0 (#316)
- chore(deps): update dependency typescript to v6.0.3 (#315)
- chore(deps): update node.js to v24.15.0 (#313)
- chore(deps): update semgrep/semgrep docker tag to v1.160.0 (#314)
- chore(deps): update dependency @react-pdf/renderer to v4.5.1 (#312)
- chore(deps): update nextjs monorepo to v16.2.4 (#311)
- chore(deps): update grafana/otel-lgtm docker tag to v0.24.1 (#310)
- chore(deps): update dependency prettier to v3.8.3 (#309)
- chore(deps): update dependency @auth/prisma-adapter to v2.11.2 (#307)
- chore(deps): update dependency next-auth to v5.0.0-beta.31 (#308)
- chore(deps): update dependency dotenv to v17.4.2 (#306)
- chore(deps): update pnpm/action-setup action to v6
- chore(deps): update dependency @react-pdf/renderer to v4.4.1 (#303)
- chore(deps): update semgrep/semgrep docker tag to v1.159.0 (#304)
- chore(deps): update grafana/otel-lgtm docker tag to v0.24.0 (#302)
- chore(deps): update semgrep/semgrep docker tag to v1.158.0 (#301)
- chore(deps): update dependency @types/node to v25.6.0 (#300)
- chore(deps): update dependency prettier to v3.8.2 (#299)
- chore(deps): update vitest monorepo to v4.1.4 (#297)
- chore(deps): update dependency lucide-react to v1.8.0 (#298)
- chore(deps): update dependency vite to v8.0.8 (#296)
- chore(deps): update nextjs monorepo to v16.2.3 (#294)
- chore(deps): update react monorepo to v19.2.5 (#295)
- chore(deps): update dependency import-in-the-middle to v3.0.1 (#293)
- chore(deps): update prisma monorepo to v7.7.0 (#292)
- chore(deps): update dependency vite to v8.0.7 (#291)
- chore(deps): update dependency nodemailer to v8.0.5 (#290)
- chore(deps): update dependency vite to v8.0.6 (#289)
- chore(deps): update vitest monorepo to v4.1.3 (#288)
- chore(deps): update dependency jsdom to v29.0.2 (#287)

## [0.7.0] - 2026-04-07

- test: improve unit test coverage across key business logic files
- docs: update openspec
- feat: general improvements
- chore(deps): update dependency @react-pdf/renderer to v4.4.0 (#286)
- chore(deps): update dependency eslint-plugin-simple-import-sort to v13

## [0.6.4] - 2026-04-06

- fix: stale email confirmation

## [0.6.3] - 2026-04-06

- fix(auth,csp): include turnstile origins in CSP and propagate emailVerified in session
- chore(deps): update dependency vite to v8.0.5 (#281)

## [0.6.2] - 2026-04-06

- refactor: jwt token structure
- refactor: use shared month names from utils
- chore(deps): update dependency vite to v8.0.4 (#278)
- chore(deps): update dependency dotenv to v17.4.1 (#277)

## [0.6.1] - 2026-04-05

- feat: add assign existing apartments view
- fix: mobile support
- fix: csp headers

## [0.6.0] - 2026-04-05

- fix: minor security issues
- feat: add basic pdf export
- feat: add automated user creation
- chore(deps): update dependency @types/nodemailer to v8
- docs: add testing spec
- chore(deps): update node.js to v24.14.1 (#273)
- chore: change node docker image tag to 24.14.0-alpine
- chore: update license information and program description
- docs: add existing specs

## [0.5.23] - 2026-04-03

- chore: onboard openspec
- chore(deps): update dependency @types/node to v25.5.2 (#272)
- chore(deps): update dependency @types/node to v25.5.1 (#270)
- chore(deps): update grafana/otel-lgtm docker tag to v0.23.0 (#271)
- chore(deps): update dependency dotenv to v17.4.0 (#269)
- chore(deps): update dependency @playwright/test to v1.59.1 (#268)
- chore(deps): update dependency @playwright/test to v1.59.0 (#266)
- chore(deps): update semgrep/semgrep docker tag to v1.157.0 (#267)
- chore(deps): update nextjs monorepo to v16.2.2 (#265)
- chore(deps): update dependency @marsidev/react-turnstile to v1.5.0 (#264)
- chore(deps): update prisma monorepo to v7.6.0 (#263)
- chore(deps): update grafana/otel-lgtm docker tag to v0.22.1 (#262)
- chore(deps): update vitest monorepo to v4.1.2 (#261)
- chore(deps): update dependency vite to v8.0.3 (#260)
- chore(deps): update opentelemetry-js-contrib monorepo (#259)
- chore(deps): update dependency lucide-react to v1.7.0 (#258)
- chore(deps): update opentelemetry-js monorepo (#257)
- chore(deps): update dependency nodemailer to v8.0.4 (#256)
- chore(deps): update dependency lucide-react to v1.6.0 (#255)
- chore(deps): update dependency typescript to v6
- chore(deps): update dependency lucide-react to v1
- chore(deps): update vitest monorepo to v4.1.1 (#252)
- chore(deps): update dependency vite to v8.0.2 (#251)
- chore(deps): update dependency @types/pg to v8.20.0 (#250)
- chore(deps): update nextjs monorepo to v16.2.1 (#249)
- chore(deps): update grafana/otel-lgtm docker tag to v0.22.0 (#248)
- chore(deps): update dependency jsdom to v29.0.1 (#247)
- chore(deps): update dependency vite to v8.0.1 (#246)
- chore(deps): update nextjs monorepo to v16.2.0 (#245)
- chore: add AGENTS.md
- chore(deps): update tailwindcss monorepo to v4.2.2 (#244)
- chore(deps): update dependency eslint-plugin-playwright to v2.10.1 (#243)
- chore(deps): update dependency nodemailer to v8.0.3 (#242)
- chore(deps): update semgrep/semgrep docker tag to v1.156.0 (#241)
- chore(deps): update pnpm/action-setup action to v5
- chore(deps): update nextjs monorepo to v16.1.7 (#239)
- chore(deps): update dependency jsdom to v29
- chore(deps): update dependency eslint-plugin-playwright to v2.10.0 (#237)
- chore(deps): update dependency lint-staged to v16.4.0 (#236)
- chore(deps): update dependency @vitejs/plugin-react to v6.0.1 (#234)
- chore(deps): update grafana/otel-lgtm docker tag to v0.21.0 (#235)

## [0.5.22] - 2026-03-12

- chore(deps): update dependency vite to v8 and @vitejs/plugin-react to v6
- chore(deps): update vitest monorepo to v4.1.0 (#229)
- chore(deps): update dependency @vitejs/plugin-react to v5.2.0 (#231)
- chore(deps): update dependency @types/node to v25.5.0 (#230)
- chore(deps): update semgrep/semgrep docker tag to v1.155.0 (#228)
- chore(deps): update prisma monorepo to v7.5.0 (#227)
- chore(deps): update dependency lint-staged to v16.3.3 (#226)
- chore(deps): update dependency @types/node to v25.4.0 (#225)
- chore(deps): update dependency nodemailer to v8.0.2 (#224)
- chore(deps): update aquasecurity/trivy-action action to v0.35.0 (#223)
- chore(deps): update dependency eslint to v9.39.4 (#222)
- chore(deps): update grafana/otel-lgtm docker tag to v0.20.0 (#221)
- chore(deps): update docker/build-push-action action to v7
- chore(deps): update dependency @types/node to v25.3.5 (#220)
- chore(deps): update dependency @types/node to v25.3.4 (#218)
- chore(deps): update docker/metadata-action action to v6
- chore(deps): update docker/login-action action to v4
- chore(deps): update docker/setup-buildx-action action to v4
- chore(deps): update dependency pg to v8.20.0 (#215)
- chore(deps): update opentelemetry-js-contrib monorepo (#213)
- chore(deps): update semgrep/semgrep docker tag to v1.154.0 (#214)
- chore(deps): update dependency lucide-react to ^0.577.0 (#211)
- chore(deps): update opentelemetry-js monorepo (#210)
- chore(deps): update dependency lint-staged to v16.3.2 (#209)
- chore(deps): update actions/upload-artifact action to v7
- chore(deps): update aquasecurity/trivy-action action to v0.34.2 (#208)
- chore(deps): update dependency lucide-react to ^0.576.0 (#207)
- chore(deps): update dependency eslint-plugin-playwright to v2.9.0 (#206)
- chore(deps): update dependency lint-staged to v16.3.1 (#205)
- chore(deps): update dependency @types/node to v25.3.3 (#204)
- chore(deps): update dependency @types/pg to v8.18.0 (#203)
- chore(deps): update dependency lint-staged to v16.3.0 (#202)
- chore(deps): update semgrep/semgrep docker tag to v1.153.1 (#201)
- chore(deps): update prisma monorepo to v7.4.2 (#200)
- chore(deps): update dependency eslint-plugin-playwright to v2.8.0 (#199)
- chore(deps): update grafana/otel-lgtm docker tag to v0.19.1 (#198)
- chore(deps): update postgres docker tag to v18.3 (#196)
- chore(deps): update dependency @types/node to v25.3.2 (#195)
- chore(deps): update dependency @opentelemetry/semantic-conventions to v1.40.0 (#194)
- chore(deps): update dependency @types/node to v25.3.1 (#192)
- chore(deps): update node.js to v24.14.0 (#190)
- chore(deps): update semgrep/semgrep docker tag to v1.153.0 (#193)
- chore(deps): update dependency pg to v8.19.0 (#191)
- chore: change postgres docker tag to 18.2-alpine
- chore(deps): update tailwindcss monorepo to v4.2.1 (#189)
- chore(deps): update dependency eslint-plugin-playwright to v2.7.1 (#188)
- chore(deps): update aquasecurity/trivy-action action to v0.34.1 (#187)
- chore(deps): update dependency @types/nodemailer to v7.0.11 (#186)
- chore(deps): update dependency eslint to v9.39.3 (#185)
- chore(deps): update grafana/otel-lgtm docker tag to v0.19.0 (#184)

## [0.5.21] - 2026-02-19

- chore(deps): update prisma monorepo to v7.4.1 (#183)
- chore(deps): update dependency lucide-react to ^0.575.0 (#182)
- chore(deps): update dependency tailwind-merge to v3.5.0 (#181)
- chore(deps): update dependency @types/node to v25.3.0 (#180)
- chore(deps): update tailwindcss monorepo to v4.2.0 (#179)
- chore(deps): update dependency eslint-plugin-playwright to v2.7.0 (#178)
- chore(deps): update semgrep/semgrep docker tag to v1.152.0 (#177)
- chore(deps): update dependency eslint-plugin-playwright to v2.6.0 (#176)
- chore(deps): update dependency lucide-react to ^0.574.0 (#175)
- chore(deps): update dependency lucide-react to ^0.571.0 (#173)
- chore(deps): update opentelemetry-js-contrib monorepo (#174)
- chore(deps): update dependency @types/nodemailer to v7.0.10 (#172)
- chore(deps): update dependency tailwind-merge to v3.4.1 (#171)
- chore(deps): update dependency jsdom to v28.1.0 (#170)
- chore(deps): update grafana/otel-lgtm docker tag to v0.18.1 (#169)
- chore(deps): update dependency lucide-react to ^0.564.0 (#168)
- chore(deps): update opentelemetry-js monorepo (#167)
- chore(deps): update dependency dotenv to v17.3.1 (#166)
- chore(deps): update aquasecurity/trivy-action action to v0.34.0 (#165)
- chore(deps): update prisma monorepo to v7.4.0 (#164)
- chore(deps): update dependency @types/react to v19.2.14 (#163)
- docs: add changelog

## [0.5.20] - 2026-02-10

- chore(deps): update dependency @types/node to v25.2.3 (#160)
- chore(deps): update dependency @vitejs/plugin-react to v5.1.4 (#159)
- chore(deps): update dependency pino to v10.3.1 (#158)
- chore(deps): update dependency eslint-plugin-unused-imports to v4.4.1 (#157)
- chore(deps): update dependency @types/node to v25.2.2 (#156)
- chore(deps): update dependency nodemailer to v8.0.1 (#155)
- chore(deps): update dependency @playwright/test to v1.58.2 (#153)
- chore(deps): update grafana/otel-lgtm docker tag to v0.17.1 (#152)
- chore(deps): update dependency dotenv to v17.2.4 (#151)
- chore(deps): update dependency nodemailer to v8
- chore(deps): update dependency @types/node to v25.2.1 (#150)
- chore(deps): update dependency @types/react to v19.2.13 (#149)
- chore(deps): update semgrep/semgrep docker tag to v1.151.0 (#148)
- chore(deps): update dependency @marsidev/react-turnstile to v1.4.2 (#147)
- chore(deps): update dependency @types/react to v19.2.11 (#145)
- chore(deps): update dependency jsdom to v28
- chore(deps): update dependency import-in-the-middle to v3
- chore(deps): update dependency @vitejs/plugin-react to v5.1.3 (#142)
- chore(deps): update dependency @types/node to v25.2.0 (#141)
- chore(deps): update dependency @playwright/test to v1.58.1 (#139)
- chore(deps): update dependency pg to v8.18.0 (#140)
- chore(deps): update grafana/otel-lgtm docker tag to v0.17.0 (#138)

## [0.5.19] - 2026-01-28

- chore(deps): update dependency @types/node to v25.1.0 (#137)
- chore(deps): update nextjs monorepo to v16.1.6 (#136)
- chore(deps): update dependency import-in-the-middle to v2.0.6 (#135)
- chore(deps): update dependency nodemailer to v7.0.13 (#134)
- chore(deps): update dependency @types/react to v19.2.10 (#133)
- chore(deps): update react monorepo to v19.2.4 (#131)
- chore(deps): update dependency @types/nodemailer to v7.0.9 (#132)
- chore(deps): update nextjs monorepo to v16.1.5 (#130)
- chore(deps): update dependency eslint-plugin-playwright to v2.5.1 (#129)
- chore(deps): update dependency @playwright/test to v1.58.0 (#127)
- chore(deps): update dependency lucide-react to ^0.563.0 (#128)
- chore(deps): update dependency pino to v10.3.0 (#125)
- chore(deps): update grafana/otel-lgtm docker tag to v0.16.0 (#126)
- chore(deps): update vitest monorepo to v4.0.18 (#124)
- chore(deps): update opentelemetry-js-contrib monorepo (#123)
- chore(deps): update semgrep/semgrep docker tag to v1.150.0 (#122)
- chore(deps): update dependency @types/node to v25.0.10 (#121)
- chore(deps): update opentelemetry-js monorepo (#120)
- chore(deps): update dependency prettier to v3.8.1 (#119)

## [0.5.18] - 2026-01-21

- chore(deps): update prisma monorepo to v7.3.0 (#118)
- chore(deps): update dependency pg to v8.17.2 (#117)
- chore(deps): update dependency import-in-the-middle to v2.0.5 (#116)
- chore(deps): update dependency @types/react to v19.2.9 (#115)
- chore(deps): update nextjs monorepo to v16.1.4 (#114)

## [0.5.17] - 2026-01-19

- chore(deps): update dependency pino to v10.2.1 (#113)
- chore(deps): update dependency @testing-library/react to v16.3.2 (#112)
- chore(deps): update nextjs monorepo to v16.1.3 (#110)
- chore(deps): update dependency @opentelemetry/semantic-conventions to v1.39.0 (#111)
- chore(deps): update grafana/otel-lgtm docker tag to v0.15.0 (#109)
- chore(deps): update dependency @types/node to v25.0.9 (#108)
- chore(deps): update opentelemetry-js-contrib monorepo (#107)
- chore(deps): update opentelemetry-js monorepo (#105)
- chore(deps): update semgrep/semgrep docker tag to v1.148.0 (#106)
- chore(deps): update dependency pg to v8.17.1 (#103)
- chore(deps): update node.js to v24.13.0 (#104)
- chore(deps): update dependency prettier to v3.8.0 (#102)
- chore(deps): update nextjs monorepo to v16.1.2 (#101)
- chore(deps): update dependency pino to v10.2.0 (#100)
- chore(deps): update dependency pg to v8.17.0 (#99)
- chore(deps): update dependency import-in-the-middle to v2.0.4 (#98)
- chore(deps): update dependency eslint-plugin-prettier to v5.5.5 (#97)
- chore(deps): update dependency import-in-the-middle to v2.0.3 (#96)

## [0.5.16] - 2026-01-13

- chore(deps): update dependency @types/node to v25.0.8 (#95)
- chore(deps): update dependency @types/node to v25.0.7 (#94)
- chore(deps): update dependency import-in-the-middle to v2.0.2 (#93)
- chore(deps): update vitest monorepo to v4.0.17 (#92)
- chore(deps): update dependency eslint-plugin-playwright to v2.5.0 (#91)
- chore(deps): update dependency @types/node to v25.0.6 (#90)
- chore(deps): update dependency @types/nodemailer to v7.0.5 (#88)
- chore(deps): update dependency @types/react to v19.2.8 (#89)
- chore(deps): update dependency @types/node to v25.0.5 (#87)
- chore(deps): update dependency @types/node to v25.0.4 (#86)
- chore(deps): update dependency pino to v10.1.1 (#85)
- chore(deps): update dependency eslint-plugin-playwright to v2.4.1 (#84)
- chore(deps): update grafana/otel-lgtm docker tag to v0.14.0 (#83)
- chore(deps): update opentelemetry-js monorepo (#82)
- chore(deps): update dependency iconv-lite to v0.7.2 (#81)
- chore(deps): update semgrep/semgrep docker tag to v1.147.0 (#79)
- fix: apartment-card test hardcoded year
- chore(deps): update dependency @marsidev/react-turnstile to v1.4.1 (#78)
- chore(deps): update dependency jsdom to v27.4.0 (#77)

## [0.5.15] - 2025-12-23

- chore(deps): update nextjs monorepo to v16.1.1 (#76)
- chore(deps): update dependency nodemailer to v7.0.12 (#75)
- chore(deps): update dependency import-in-the-middle to v2.0.1 (#74)
- chore(deps): update dependency next to v16.1.0 (#73)
- chore(deps): update dependency eslint-config-next to v16.1.0 (#72)
- chore(deps): update dependency lucide-react to ^0.562.0 (#71)
- chore(deps): update opentelemetry-js-contrib monorepo (#69)
- chore(deps): update semgrep/semgrep docker tag to v1.146.0 (#70)
- chore(deps): update prisma monorepo to v7.2.0 (#68)
- chore(deps): update dependency @types/node to v25.0.3 (#67)
- chore(deps): update vitest monorepo to v4.0.16 (#66)
- chore(deps): update dependency @testing-library/react to v16.3.1 (#65)
- chore(deps): update dependency @types/node to v25.0.2 (#64)

## [0.5.14] - 2025-12-13

- feat: adjust dockerfile
- feat: enable test coverage
- chore(deps): update dependency iconv-lite to v0.7.1 (#51)
- chore(deps): update actions/upload-artifact action to v6
- chore(deps): update dependency eslint to v9.39.2 (#61)
- chore(deps): update semgrep/semgrep docker tag to v1.145.2 (#62)
- fix(deps): update dependency lucide-react to ^0.561.0 (#59)
- chore(deps): update grafana/otel-lgtm docker tag to v0.13.0 (#58)
- chore(deps): update node.js to v24.12.0 (#57)
- fix(deps): update react monorepo to v19.2.3 (#54)
- fix(deps): update nextjs monorepo to v16.0.10 (#56)
- chore(deps): update semgrep/semgrep docker tag to v1.145.1 (#55)
- fix(deps): update nextjs monorepo to v16.0.9 (#53)
- chore(deps): update tailwindcss monorepo to v4.1.18 (#52)
- fix(deps): update dependency lucide-react to ^0.560.0 (#50)

## [0.5.13] - 2025-12-10

- fix: pnpm lockfile
- feat: hash one time tokens
- chore(deps): update dependency @types/pg to v8.16.0 (#49)
- chore(deps): update dependency @types/node to v24.10.3 (#48)
- chore: adjust husky configuration
- fix(deps): update dependency lucide-react to ^0.559.0 (#47)

## [0.5.12] - 2025-12-09

- chore(deps): update dependency @marsidev/react-turnstile to v1.4.0
- chore: add license
- chore(deps): update dependency @types/node to v24.10.2
- fix(deps): update nextjs monorepo to v16.0.8
- chore(deps): update dependency jsdom to v27.3.0
- chore(deps): update dependency @vitejs/plugin-react to v5.1.2

## [0.5.11] - 2025-12-07

- test: add missing test for email template loader
- fix: security issues

## [0.5.10] - 2025-12-06

- feat: add security scan workflow
- fix: emails should not be sent on all user updates
- fix: hide dashboard buttons if no data is available
- fix(deps): update dependency lucide-react to ^0.556.0
- chore(deps): update grafana/otel-lgtm docker tag to v0.12.0
- chore: adjust grafana dashboard

## [0.5.9] - 2025-12-05

- fix: otel resource for metrics

## [0.5.8] - 2025-12-04

- feat: add grafana dashboard
- feat: improve otel integration

## [0.5.7] - 2025-12-04

- feat: add trace id to logger

## [0.5.6] - 2025-12-04

- fix: skip healtchecks when tracing

## [0.5.5] - 2025-12-04

- feat: add opentelemetry tracing
- chore(deps): update actions/upload-artifact action to v5
- feat: add e2e tests

## [0.5.4] - 2025-12-03

- chore: update prisma read replicas extension to v0.5.0
- fix(deps): update react monorepo to v19.2.1
- fix(deps): update nextjs monorepo to v16.0.7
- chore(deps): update prisma monorepo to v7.1.0
- chore(deps): update dependency prettier to v3.7.4
- chore(deps): update vitest monorepo to v4.0.15
- chore(deps): update dependency pino-pretty to v13.1.3

## [0.5.3] - 2025-11-30

- feat: improve apartment sorting logic
- feat: update admin apartments list sorting and URL state
- feat: update payments tables
- feat: parse charges from payment files
- fix(deps): update nextjs monorepo to v16.0.6
- chore(deps): update dependency tsx to v4.21.0
- chore(deps): update dependency prettier to v3.7.3

## [0.5.2] - 2025-11-29

- chore(deps): update dependency prettier to v3.7.2
- fix: inactive apartments should be visible

## [0.5.1] - 2025-11-28

- fix: migration script
- feat: owners should be respected during import

## [0.5.0] - 2025-11-27

- chore: bump up prettier
- feat: add stats to import page
- feat: make import process more reliable and fast
- fix: apartment share
- fix: allow hashtags in owner name
- fix(deps): update nextjs monorepo to v16.0.5
- fix(deps): update dependency lucide-react to ^0.555.0
- chore(deps): update dependency nodemailer to v7.0.11

## [0.4.4] - 2025-11-25

- chore: skip emails when not configured
- chore(deps): update dependency @types/react to v19.2.7
- fix(deps): update nextjs monorepo to v16.0.4
- chore(deps): update vitest monorepo to v4.0.14
- chore(deps): update prisma monorepo to v7.0.1
- chore: adjust nextauth logging
- feat: adjust admin ui
- chore: enable renovate automerge

## [0.4.3] - 2025-11-23

- fix: email verification on idp login

## [0.4.2] - 2025-11-23

- refactor: replace AuthMethod string literals with enum
- feat: make navbar collapsible on mobile with optimized DB calls

## [0.4.1] - 2025-11-23

- fix: readonly replicas
- chore: remove unused workflow parameters

## [0.4.0] - 2025-11-23

- fix: resolve all TypeScript implicit any type errors
- feat: add database read replicas support
- fix: tests
- feat: make Cloudflare Turnstile optional
- refactor: clean up dashboard animations
- feat: integrate Google OAuth with authMethod tracking and admin notifications
- chore: move turnscale widget

## [0.3.4] - 2025-11-22

- fix: turnstile on second attempt

## [0.3.3] - 2025-11-22

- chore: add cf turnstile site key to build env
- chore: remove unused script

## [0.3.2] - 2025-11-21

- format: run prettier
- chore(deps): update vitest monorepo to v4.0.13
- feat: add cloudflare turnstile
- chore: renove unused public files
- chore: rename reset password

## [0.3.1] - 2025-11-21

- chore: adjust placeholders
- feat: add tracking script

## [0.3.0] - 2025-11-21

- refactor: layout
- feat: add email notifications

## [0.2.0] - 2025-11-20

- Initial commit
- feat: initialize project
- feat: add Prisma database schema with User and Apartment models
- feat: add authentication system with NextAuth.js
- feat: fix ISO-8859-2 encoding, add home redirects, update dashboard, and add unit tests
- Add user login tests and refactor import to use buffers
- Add UI component tests and configure ESLint with Husky
- refactor: migrate from magic strings to type-safe enums
- fix: configure Docker image with Prisma support and authentication
- feat: add automated migrations
- feat: implement Homeowners Association (HOA) management system
- Add custom confirm dialogs, animations, and ESLint improvements
- refactor: extract duplicate test data into reusable fixtures
- test: add comprehensive tests for AlertDialog and ConfirmDialog components
- Fix apartment assignment to allow removal and show context-aware list
- Refactor dashboard: add collapsible user status and separate components
- feat(dashboard): improve apartment display and payments UI
- feat: add user management and profile features
- feat: add comprehensive logging across the application
- Add renovate.json
