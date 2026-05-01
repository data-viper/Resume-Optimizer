# Roadmap

## Phase 1 — Project Setup (Current)
- [x] Project structure + MD documentation
- [ ] `git init` + `.gitignore`
- [ ] `npx create-next-app@latest` with TypeScript + Tailwind
- [ ] Install core dependencies
- [ ] Wire up `.env.local` with `ANTHROPIC_API_KEY`
- [ ] Verify Claude API call works end-to-end (hello world test)

## Phase 2 — Ingestion
- [ ] Resume upload UI (PDF/DOCX + drag-drop)
- [ ] `POST /api/parse` — extract text from uploaded file
- [ ] JD paste textarea
- [ ] Store both in session state (no DB yet)

## Phase 3 — Tailoring Engine
- [ ] `POST /api/tailor` — Claude call chain
  - Call 1: extract JD requirements as structured JSON
  - Call 2: tailor resume with prompt caching on system prompt
- [ ] Return `{ original, tailored, score }` to frontend
- [ ] Display tailored resume in preview pane

## Phase 4 — ATS Scoring + Feedback
- [ ] Keyword overlap scorer
- [ ] Before/after score display
- [ ] ATS safety warnings (if uploaded resume has unsafe formatting)
- [ ] Section-level regenerate

## Phase 5 — Export
- [ ] PDF export (ATS-safe)
- [ ] DOCX export
- [ ] Plain text copy

## Phase 6 — Auth + Accounts
- [ ] NextAuth.js setup
- [ ] Prisma schema (users, resumes, applications)
- [ ] Supabase PostgreSQL
- [ ] Save/load resume history
- [ ] Protected routes

## Phase 7 — Hosting
- [ ] Deploy to Vercel
- [ ] Set production env vars in Vercel dashboard
- [ ] Custom domain (optional)
- [ ] Basic monitoring

## Phase 8 — Hardening
- [ ] Rate limiting (upstash/redis or simple IP-based)
- [ ] Error handling + user-friendly error messages
- [ ] Input size limits (max resume / JD length)
- [ ] Basic analytics (Vercel Analytics)
