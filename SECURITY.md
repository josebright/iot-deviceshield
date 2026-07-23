# Security policy

This is a personal project, not a hosted service. There is no active bug bounty. That said, if you find something worth reporting, I want to hear about it.

## Supported versions

Only the latest commit on `main` receives security fixes.

| Version         | Supported |
| --------------- | :-------: |
| `main` (latest) |    ✅     |
| Older commits   |    ❌     |

## Reporting a vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Report privately via one of:

- GitHub's [Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (preferred).
- Email <jchukwu61@gmail.com> with the subject line `SECURITY: iot-deviceshield`.

Please include:

1. A description of the issue and the impact you believe it has.
2. Steps to reproduce (a proof of concept is welcome but not required).
3. The commit SHA you tested against.
4. Any suggested mitigation.

I will acknowledge within 72 hours and aim to publish a fix or a documented mitigation within 14 days for high or critical issues, and 30 days for medium or low.

## In-scope

- Authentication or authorization bypass on any `/v1/admin/*` or `/v1/catalog/*` mutating endpoint (guarded by `ADMIN_API_TOKEN`).
- Server-side request forgery, injection (SQL, command, prompt), path traversal.
- Sensitive data exposure (secrets, session tokens, environment variables).
- Denial of service that a modest attacker can trigger from the public API surface (does not include volumetric DDoS).
- Container escape or privilege escalation in the shipped Docker images.
- Any dependency vulnerability with a working exploit against this project.

## Out of scope

- Missing best-practice headers on endpoints not served by this project.
- Rate-limit tuning suggestions without a working abuse case.
- Social engineering, physical attacks, or attacks requiring compromised end-user devices.
- Findings in the two archived predecessor repositories (`cve-vulnerability-api`, `shd-risk-assessment`) — those are no longer maintained.

## Secret handling

- Secrets must never be committed. `.env` is git-ignored; `.env.example` is the only checked-in template.
- Gitleaks runs on every push and PR. A finding blocks merge.
- Rotating a leaked secret is a P0: revoke at the provider first, then purge history if it was ever pushed.

## Automated security controls

Every PR runs (see `.github/workflows/ci.yml`):

- **OSV-Scanner** reads `pnpm-lock.yaml`, queries the OSV database (aggregates GHSA + npm advisories + others), fails on HIGH or CRITICAL.
- **Semgrep** SAST across TypeScript, Node, NestJS, Next.js, OWASP Top 10, Dockerfile, and secrets rulesets.
- **Gitleaks** secret scan on the full history.
- **CodeQL** semantic SAST for TS/JS.
- **Trivy** OS + language CVE scan on both container images (fails on HIGH or CRITICAL).

Findings are uploaded as SARIF to the repository's Security tab.
