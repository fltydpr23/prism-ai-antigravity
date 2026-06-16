Prism Security Architecture v1.0

Production Security & Infrastructure Blueprint

Author: Adhityan Rajendran

Purpose:
This document defines the security architecture for Prism. It serves as the source of truth for future development and should be referenced by Claude, Gemini, GPT, or any engineer working on the platform.

Goal:
Build a secure, scalable, enterprise-ready consumer intelligence platform while maintaining development velocity.

⸻

Security Philosophy

Security is not one feature.

Security is a layered system.

Prism should follow a defense-in-depth approach where multiple independent safeguards exist between users, infrastructure, data, and AI systems.

The objective is not to become impossible to attack.

The objective is to:

* Prevent common attacks
* Limit blast radius
* Protect user data
* Protect intellectual property
* Prevent API abuse
* Enable enterprise trust

⸻

Layer 1 — Secret Management

Objective

Prevent exposure of:

* Together API Keys
* OpenAI Keys
* Anthropic Keys
* Database Credentials
* Storage Credentials
* OAuth Secrets
* JWT Secrets

⸻

Rules

Never commit secrets to Git.

Never store secrets inside source code.

Never expose secrets to the browser.

⸻

Required Git Ignore Rules

.env
.env.local
.env.production
.env.development
.env.*

⸻

Verification Before Every Commit

git status

Verify no environment files are being tracked.

⸻

If A Secret Is Accidentally Committed

Immediately:

1. Remove secret
2. Rewrite history if needed
3. Rotate compromised key
4. Generate replacement key

Never assume a deleted key is safe.

⸻

Layer 2 — Environment Variable Security

Objective

Keep all credentials server-side.

⸻

Correct

TOGETHER_API_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx

⸻

Incorrect

NEXT_PUBLIC_TOGETHER_API_KEY=xxxx

Anything using:

NEXT_PUBLIC_

becomes visible in the browser.

⸻

Storage Location

Production secrets must only exist inside:

Vercel Environment Variables

Environment Separation:

* Development
* Preview
* Production

All should use separate keys.

⸻

Layer 3 — AI API Isolation

Objective

Prevent users from seeing or abusing API credentials.

⸻

Forbidden Architecture

Browser
  ↓
Together API

⸻

Required Architecture

Browser
  ↓
Prism Backend
  ↓
Together API

⸻

Benefits:

* Hidden API keys
* Centralized billing
* Request validation
* Usage tracking
* Rate limiting

⸻

Layer 4 — Prompt Protection

Objective

Protect Prism intellectual property.

⸻

System prompts represent:

* Product logic
* Competitive advantage
* Classification systems
* Intelligence frameworks

⸻

Rules

Prompts must never exist inside:

* React components
* Frontend bundles
* Browser-accessible code

⸻

Store prompts:

* Server-side
* Database
* Protected configuration

⸻

Layer 5 — Authentication

Objective

Ensure every action is tied to an authenticated user.

⸻

Recommended Provider

Clerk

Alternative:

Better Auth

⸻

Requirements

* OAuth
* Email Login
* Passwordless Login
* Session Management
* MFA Support

⸻

Never build custom authentication.

⸻

Layer 6 — Authorization

Objective

Users should only access their own data.

⸻

Implement:

Role Based Access Control

Examples:

* Admin
* Team Owner
* Analyst
* Viewer

⸻

Future Enterprise Roles:

* Client Admin
* Workspace Admin
* Auditor

⸻

Layer 7 — Database Security

Objective

Protect user data at database level.

⸻

Recommended:

Supabase

⸻

Mandatory

Enable:

Row Level Security (RLS)

For every table.

⸻

Without RLS:

User A may access User B’s data.

⸻

Examples:

* reports
* uploads
* organizations
* projects
* workspaces

All must have RLS.

⸻

Layer 8 — File Upload Security

Objective

Prevent malicious uploads.

⸻

Allowed:

* CSV
* PDF
* DOCX
* TXT
* XLSX

⸻

Blocked:

* EXE
* APK
* SH
* BAT
* DMG

⸻

Validate:

* MIME Type
* File Size
* Extension

Before processing.

⸻

Future:

* Virus Scanning
* Malware Detection

⸻

Layer 9 — Storage Security

Objective

Store uploaded files securely.

⸻

Recommended:

Cloudflare R2

Alternative:

Amazon S3

⸻

Do NOT store uploads:

* Inside Vercel
* Inside Git
* On local disk

⸻

Use:

Private Buckets

Generate:

Temporary Signed URLs

For access.

⸻

Layer 10 — Rate Limiting

Objective

Prevent abuse and uncontrolled AI spending.

⸻

Recommended:

Upstash

Alternative:

Arcjet

⸻

Examples:

Free Tier

* 3 reports/day
* 5 uploads/day

Pro Tier

* 100 reports/day

⸻

Prevent:

* Spam
* Cost explosions
* Bot abuse

⸻

Layer 11 — Usage Controls

Objective

Protect AI budgets.

⸻

Track:

* Tokens
* Reports
* Uploads
* Storage
* Team Usage

⸻

Hard Limits:

Stop processing after quota exceeded.

⸻

Soft Limits:

Warning banners.

⸻

Layer 12 — Logging & Observability

Objective

Detect problems without exposing sensitive data.

⸻

Never Log:

* Raw API keys
* Full transcripts
* Customer documents
* User secrets

⸻

Log:

* Request IDs
* Processing Time
* Errors
* User IDs
* Token Usage

⸻

Recommended:

Sentry

PostHog

OpenTelemetry

⸻

Layer 13 — Infrastructure Segregation

Objective

Separate environments.

⸻

Required Environments:

Development

Preview

Production

⸻

Each Environment Needs:

* Separate database
* Separate API keys
* Separate storage bucket

⸻

Compromise of one environment should not compromise others.

⸻

Layer 14 — AI Safety Layer

Objective

Protect AI infrastructure.

⸻

Validate:

* File size
* Content type
* Prompt size
* Request frequency

⸻

Prevent:

* Prompt injection attacks
* Excessive token consumption
* Recursive AI abuse

⸻

Implement:

Input sanitization

Maximum token limits

Maximum upload sizes

⸻

Layer 15 — Intellectual Property Protection

Objective

Protect Prism’s competitive advantage.

⸻

Critical Assets:

* Prompt systems
* Classification frameworks
* Signal extraction logic
* Report generation workflows
* Scoring methodologies

⸻

Never expose:

* System prompts
* Internal reasoning chains
* Classification instructions

⸻

Return only:

{
  "report": {},
  "insights": []
}

Never reveal internal architecture.

⸻

Recommended Prism Production Stack

Frontend:

* Next.js
* Vercel

Authentication:

* Clerk

Database:

* Supabase

Storage:

* Cloudflare R2

AI:

* Together AI

Rate Limiting:

* Upstash

Monitoring:

* Sentry
* PostHog

Payments:

* Stripe

⸻

Security Checklist Before Launch

Secrets

* No secrets in Git
* No secrets in frontend
* Keys rotated

Auth

* Clerk enabled
* MFA supported

Database

* RLS enabled everywhere

Uploads

* Validation enabled
* File size limits enabled

AI

* Backend-only API calls
* Rate limiting enabled

Storage

* Private buckets
* Signed URLs

Monitoring

* Error tracking enabled
* Usage tracking enabled

Production

* Separate production environment
* Separate production keys

⸻

Final Principle

The biggest risk to Prism is not a sophisticated hacker.

The biggest risk is accidental exposure:

* committed secrets
* missing RLS policies
* frontend API keys
* unrestricted uploads
* missing rate limits

Eliminate those risks first.

Enterprise-grade security begins with disciplined architecture.