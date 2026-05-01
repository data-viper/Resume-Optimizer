# ResumeOptimizer

## What It Is
A hosted web tool that takes a user's resume and a job description (JD), then uses Claude AI to tailor the resume for maximum ATS (Applicant Tracking System) compatibility.

## Core Goal
Given any JD, produce a tailored resume that:
- Scores as high as possible through ATS filters
- Mirrors JD keywords and phrasing naturally
- Preserves the user's actual experience (no fabrication)
- Exports in clean, ATS-safe formatting (PDF / DOCX)

## Key Principles
- **Accuracy over creativity** — never invent experience, only reframe real experience
- **ATS-first formatting** — no tables, columns, graphics, headers/footers in the output
- **User owns their data** — resumes and JDs are not stored longer than the session unless user opts in
- **Secure by default** — auth required before any processing

## Phases
| Phase | Scope |
|-------|-------|
| 1 | Project setup, architecture, local dev environment |
| 2 | Resume + JD ingestion (upload / paste) |
| 3 | Claude API integration — tailoring engine |
| 4 | ATS scoring + feedback loop |
| 5 | Export (PDF/DOCX) |
| 6 | User auth + account (save resumes, history) |
| 7 | Hosting + deployment |
| 8 | Polish, rate limiting, billing (optional) |

## Tech Decisions
| Concern | Choice | Reason |
|---------|--------|--------|
| Frontend | Next.js (React) | SSR, easy Vercel deploy, full-stack in one repo |
| Backend | Next.js API routes | Keeps stack simple for MVP |
| AI | Anthropic Claude API (claude-sonnet-4-6) | Best instruction following, long context for resume+JD |
| Auth | NextAuth.js + JWT | Quick to wire up, extensible to OAuth later |
| Database | PostgreSQL via Prisma | Typed, relational, good for user + resume records |
| File parsing | pdf-parse + mammoth | PDF and DOCX extraction |
| Export | puppeteer or react-pdf | PDF generation |
| Hosting | Vercel (frontend) + Supabase (DB) | Fast MVP deployment |
| Env secrets | .env.local (never committed) | ANTHROPIC_API_KEY lives here |
