# CI/CD

## CI — `.github/workflows/ci.yml`

This branch is intentionally a documentation/contract baseline. The CI workflow runs on pull requests and pushes to `main`; it validates required contract documents and checks whitespace errors with `git diff --check`. It does **not** build or deploy application components because application implementation directories were removed from this branch.

When implementation is rebuilt, add back explicit jobs for the chosen backend, admin, mobile, and integration-test stacks only after the respective source trees and test commands exist. Keep least-privilege permissions, pin actions, use timeouts/concurrency, avoid production secrets in CI, and never deploy production from an untrusted pull request.

## CD — not active

Templates in `cd-templates/` are references only and are not active GitHub workflows. Production deployment must remain disabled until hosting, secrets, environments, approvals, and branch protection are deliberately configured and verified.

## Branch protection

After the workflow has run successfully at least once, configure branch protection/rulesets for `main`: require pull requests, require the relevant CI check, block force pushes, and restrict branch deletion. Update required status-check names when the workflow changes.
