# Multitional-Translator — Contract Baseline

Repository reset baseline for Phase 1. The previous implementation is retained on its original Git branch; this branch keeps project documentation, CI/CD configuration, and the shared contract needed to rebuild the system consistently.

## Repository contents

- `.github/workflows/ci.yml` — documentation/contract baseline CI. It does not build or deploy application components.
- `docs/requirements/` — business requirements and use cases.
- `docs/architecture/` — architecture, API contract, project structure, and Phase 1 baseline.
- `docs/development/` — development and testing standards retained as references for rebuilding.
- `docs/planning/` — backlog, plan, and assumptions.
- `docs/reports/` — verification and current-state inventory.
- `docs/integrations/` — retained integration references.
- `docs/operations/` — CI/CD, deployment, and inactive CD templates.
- `LICENSE`, `.gitignore`, `.editorconfig`, `.nvmrc` — repository support files.

Application implementation directories (`apps/`, `services/`, `infra/`, `design-system/`, and `scripts/`) have intentionally been removed from this branch. Do not interpret the previous implementation as the current source of truth; use the approved contract and requirements before rebuilding.

## Phase 1 documents

- [Business requirements](docs/requirements/BRD.md)
- [Use cases](docs/requirements/Use_Case_Specification_Final_15_UC.md)
- [Architecture](docs/architecture/architecture.md)
- [API reference](docs/architecture/api.md)
- [Phase 1 inventory and contract decisions](docs/architecture/phase-1-contract-baseline.md)
- [Current-state inventory](docs/reports/current-state-inventory.md)
- [CI/CD](docs/operations/ci-cd.md)

## CI behavior

The workflow validates required baseline documents and checks patch whitespace. Application build/test jobs are intentionally absent until implementation is recreated and the corresponding jobs are reintroduced deliberately. No workflow in this branch deploys to production.
