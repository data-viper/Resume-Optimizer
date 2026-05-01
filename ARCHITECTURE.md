# Architecture

## System Overview

```
User Browser
    │
    ▼
Next.js App (Vercel)
    ├── /app                  ← React pages + layouts
    ├── /app/api              ← Server-side API routes (never exposed to client)
    │     ├── /tailor         ← Core: calls Claude API, returns tailored resume
    │     ├── /score          ← ATS keyword scoring
    │     ├── /parse          ← File parsing (PDF/DOCX → text)
    │     └── /auth           ← NextAuth endpoints
    └── /lib
          ├── claude.ts       ← Anthropic SDK wrapper
          ├── parser.ts       ← Resume + JD parsing utilities
          ├── ats.ts          ← ATS scoring logic
          └── db.ts           ← Prisma client
    │
    ▼
PostgreSQL (Supabase)
    ├── users
    ├── resumes               ← base resumes per user
    └── applications          ← tailored resume + JD per submission
    │
    ▼
Anthropic Claude API
    └── claude-sonnet-4-6     ← tailoring + keyword extraction
```

## Data Flow: Tailoring Request

```
1. User uploads/pastes resume  →  POST /api/parse  →  structured resume JSON
2. User pastes JD              →  POST /api/tailor
                                    ├── extract JD keywords (Claude call 1)
                                    ├── tailor resume sections (Claude call 2, with caching)
                                    └── return { tailored, score, diff }
3. User reviews output         →  (optional) regenerate section
4. User exports                →  POST /api/export  →  PDF/DOCX blob download
```

## Claude API Strategy
- Use **prompt caching** on the system prompt (resume tailoring instructions are long and stable)
- Call 1: Extract structured data from JD (keywords, requirements, nice-to-haves)
- Call 2: Tailor resume given structured JD data + original resume
- Keep calls separate so each can be retried independently
- Model: `claude-sonnet-4-6` for MVP (fast, cost-effective, strong instruction following)

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...        # Never commit — .env.local only
NEXTAUTH_SECRET=...
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
```

## File Structure (planned)
```
ResumeOptimizer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← Landing / upload form
│   ├── results/page.tsx      ← Tailored resume + score
│   └── api/
│       ├── tailor/route.ts
│       ├── parse/route.ts
│       ├── score/route.ts
│       └── export/route.ts
├── components/
│   ├── ResumeUpload.tsx
│   ├── JDInput.tsx
│   ├── TailoredResume.tsx
│   ├── ATSScore.tsx
│   └── ExportButtons.tsx
├── lib/
│   ├── claude.ts
│   ├── parser.ts
│   ├── ats.ts
│   └── db.ts
├── prisma/
│   └── schema.prisma
├── public/
├── .env.local                ← NEVER COMMIT
├── .gitignore
├── package.json
└── next.config.js
```
