# Tasks

## 1. Split the long requirements

- [x] 1.1 Split `authentication` (Server Action Authorization Guard) and `charges-and-payments` (Balances Derived from Opening Balance); verify `openspec validate` reports no description warnings for them
- [x] 1.2 Split the seven long `data-import` requirements; verify every original scenario is still present and each new requirement has a scenario
- [x] 1.3 Split `tooling` (Client Reads With SWR); verify its description warning is gone

## 2. Validate and sync

- [x] 2.1 Run `openspec validate split-long-requirements --strict`; verify it is valid
- [x] 2.2 Archive the change and run `openspec validate --specs --strict`; verify all specs pass

## Workflow follow-up

- Commit as `docs(openspec): split long requirements so strict validation passes`.
