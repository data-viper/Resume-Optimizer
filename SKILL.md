# Skill Tracker

All capabilities the tool needs to have. Track build status here as we implement each.

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## 1. File Parsing
| Skill | Status | Notes |
|-------|--------|-------|
| Parse PDF resume to plain text | `[ ]` | Use `pdf-parse` library |
| Parse DOCX resume to plain text | `[ ]` | Use `mammoth` library |
| Accept plain text resume paste | `[ ]` | Simple textarea input |
| Extract resume sections (Experience, Skills, Education, etc.) | `[ ]` | Claude-assisted or regex |
| Accept JD as plain text paste | `[ ]` | Simple textarea |

## 2. Claude API Integration
| Skill | Status | Notes |
|-------|--------|-------|
| Anthropic SDK setup with prompt caching | `[ ]` | `@anthropic-ai/sdk`, cache system prompt |
| Extract keywords + requirements from JD | `[ ]` | Claude call 1 |
| Tailor resume bullets to JD language | `[ ]` | Claude call 2 |
| Rewrite summary/objective for role | `[ ]` | Part of call 2 |
| Return structured diff (original vs tailored) | `[ ]` | JSON response shape |
| Handle Claude API errors + retries | `[ ]` | 429, 529 handling |

## 3. ATS Optimization
| Skill | Status | Notes |
|-------|--------|-------|
| Keyword match score (JD vs resume) | `[ ]` | Simple overlap scoring |
| Detect ATS-unsafe formatting in uploaded file | `[ ]` | Warn user on upload |
| Enforce ATS-safe output structure | `[ ]` | Single column, standard headers |
| Action verb strength scoring | `[ ]` | Compare against strong verb list |
| Before/after ATS score display | `[ ]` | Show improvement delta |

## 4. UI Components
| Skill | Status | Notes |
|-------|--------|-------|
| Resume upload (drag + drop) | `[ ]` | Accepts PDF, DOCX |
| JD text input area | `[ ]` | Large textarea |
| Loading state during Claude processing | `[ ]` | Stream or spinner |
| Side-by-side original vs tailored view | `[ ]` | Diff highlight |
| ATS score gauge/meter | `[ ]` | Visual score display |
| Section-level regenerate button | `[ ]` | Re-tailor individual sections |

## 5. Export
| Skill | Status | Notes |
|-------|--------|-------|
| Export tailored resume as PDF | `[ ]` | ATS-safe formatting |
| Export tailored resume as DOCX | `[ ]` | Use `docx` library |
| Copy to clipboard as plain text | `[ ]` | Simple copy button |

## 6. Auth (Phase 6)
| Skill | Status | Notes |
|-------|--------|-------|
| Email + password signup/login | `[ ]` | NextAuth.js credentials provider |
| Google OAuth login | `[ ]` | NextAuth.js Google provider |
| Protected routes | `[ ]` | Middleware guard |
| Save base resume to account | `[ ]` | Stored in PostgreSQL |
| Resume + JD history per user | `[ ]` | applications table |
| Delete account | `[ ]` | GDPR compliance |

## 7. Infrastructure
| Skill | Status | Notes |
|-------|--------|-------|
| Next.js project setup | `[ ]` | App router, TypeScript |
| PostgreSQL + Prisma setup | `[ ]` | Supabase for hosting |
| Environment variable management | `[ ]` | .env.local, Vercel env |
| Rate limiting on API routes | `[ ]` | Prevent abuse |
| Vercel deployment | `[ ]` | Auto-deploy from main branch |
| .gitignore (exclude .env.local) | `[ ]` | Security critical |

## 8. Nice to Have (Post-MVP)
| Skill | Status | Notes |
|-------|--------|-------|
| Cover letter generation | `[ ]` | Separate Claude call |
| LinkedIn URL scrape for JD | `[ ]` | Playwright/Puppeteer |
| Job application tracker dashboard | `[ ]` | Track applications + scores |
| Multi-template resume formats | `[ ]` | Different ATS-safe layouts |
| Bulk tailoring (multiple JDs at once) | `[ ]` | Batch API |
