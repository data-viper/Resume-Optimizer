# Requirements

## Functional Requirements

### Resume Ingestion
- [ ] Upload resume as PDF or DOCX
- [ ] Paste resume as plain text (fallback)
- [ ] Parse and extract structured sections: Summary, Experience, Skills, Education, Certifications

### JD Ingestion
- [ ] Paste JD as plain text
- [ ] (Future) Paste a job posting URL and auto-scrape

### Tailoring Engine (Claude API)
- [ ] Extract keywords, required skills, and preferred qualifications from JD
- [ ] Rewrite resume bullet points to mirror JD language
- [ ] Reorder/weight sections based on JD priorities
- [ ] Generate or rewrite Summary/Objective section targeting the role
- [ ] Ensure no fabricated experience — only reframe real content
- [ ] Return structured diff: original vs. tailored

### ATS Optimization
- [ ] Keyword match score (before and after tailoring)
- [ ] Flag ATS-unsafe formatting in uploaded resume (tables, columns, images)
- [ ] Output resume uses ATS-safe structure: single column, standard section headers
- [ ] Hard skills list extracted and matched to JD
- [ ] Action verb optimization on bullet points

### Export
- [ ] Download tailored resume as PDF
- [ ] Download tailored resume as DOCX
- [ ] Copy to clipboard as plain text

### User Auth (Phase 6)
- [ ] Email + password signup / login
- [ ] OAuth (Google) login
- [ ] Save base resume to account
- [ ] Resume history (per JD submission)
- [ ] Delete account and data

### Dashboard (Phase 6+)
- [ ] List of past tailored resumes with JD title
- [ ] ATS score history per application

## Non-Functional Requirements
- API key never exposed to client — all Claude calls server-side
- Resume content not logged or stored in plain text on server
- Rate limiting on tailoring endpoint (prevent abuse)
- Response time target: tailoring completes in < 30 seconds
- Mobile-responsive UI
- WCAG AA accessibility

## Out of Scope (MVP)
- LinkedIn profile import
- Cover letter generation (can add later)
- Multi-language resumes
- Recruiter-facing features
