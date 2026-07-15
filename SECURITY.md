# Security policy

## Supported versions

This project is in active development on `main`. Only the latest commit on `main` receives security fixes.

| Version         | Supported |
| --------------- | :-------: |
| `main` (latest) |    ✅     |
| Older commits   |    ❌     |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately via one of:

- GitHub's [Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (preferred).
- Email <jchukwu61@gmail.com> with the subject line `SECURITY: iot-deviceshield`.

Please include:

1. A description of the issue and the impact you believe it has.
2. Steps to reproduce (proof-of-concept is welcome, but not required).
3. The commit SHA or version you tested against.
4. Any suggested mitigation.

You will receive an acknowledgement within **72 hours**. We aim to publish a fix or a documented mitigation within **14 days** for high/critical issues, and **30 days** for medium/low.

## What we consider in-scope

- Authentication or authorization bypass on any `/v1/*` endpoint
- Server-side request forgery, injection (SQL, command, prompt), path traversal
- Sensitive data exposure (secrets, PII, session tokens)
- Denial-of-service that a modest attacker can trigger (does not include DDoS)
- Container escape or privilege escalation in the shipped Docker images
- Any vulnerability in dependencies with a working exploit against this project

## What we consider out-of-scope

- Missing best-practice headers on endpoints not served by us (upstream infra)
- Rate-limit tuning suggestions without a working abuse case
- Social engineering, physical attacks, or attacks requiring compromised end-user devices
- Findings in the two archived predecessor repositories (`cve-vulnerability-api`, `shd-risk-assessment`) — those are no longer maintained

## Secret handling policy

- Secrets **must never** be committed. `.env` is git-ignored; `.env.example` is the only checked-in template.
- Gitleaks runs on every push and PR. A finding blocks merge.
- Rotating a leaked secret is a **P0**: revoke at the provider first, then purge history if it was ever pushed.

## Automated security controls

Every PR runs (see `.github/workflows/ci.yml`):

- **OSV-Scanner** (Google) — reads `pnpm-lock.yaml`, queries the OSV database (aggregates GHSA + npm-advisories + others), fails on HIGH/CRITICAL
- **Semgrep** — SAST across TypeScript, Node, NestJS, Next.js, OWASP Top 10, Dockerfile, secrets rulesets
- **Gitleaks** — secret scan on the full history
- **CodeQL** — GitHub's semantic SAST for TS/JS
- **Trivy** — OS + language CVE scan on both container images (fails on HIGH/CRITICAL)

Findings are uploaded as SARIF to the repository's Security tab.
