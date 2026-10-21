# GitHub Workflows

This branch keeps a documentation/contract validation workflow at `.github/workflows/ci.yml`. It checks required baseline documents and whitespace errors only; there are no application build or deployment jobs while implementation directories are absent.

When application components are rebuilt, reintroduce test/build jobs after confirming their source trees and commands. Use least-privilege permissions, trusted triggers, timeouts, concurrency, safe secrets handling, and update `docs/operations/ci-cd.md` whenever the workflow changes. Deployment templates under `docs/operations/cd-templates/` are inactive references.
