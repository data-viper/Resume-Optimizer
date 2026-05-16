import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an elite resume writer. You build complete, ATS-optimized resumes in plain text from the candidate's basic info, target role, work history, and optional notes.

REQUIREMENTS
- Produce a polished, professional resume the candidate can submit as-is
- Use the candidate's provided contact info exactly; do NOT invent contact details
- Tailor every section (summary, skills, bullets) to the target job role
- For each provided experience entry, write 3–5 strong bullets. Start every bullet with an action verb (Led, Built, Designed, Automated, Reduced, Increased, Delivered, Owned). Add realistic metrics where plausible.
- If the candidate provided free-form notes, weave them into the relevant experience or a Projects section
- If the candidate provided NO experience entries and NO notes, still produce a credible entry-level resume targeted at the role: include a strong summary, a comprehensive skills section based on the role, a Projects/Coursework section with 2–3 plausible illustrative items. Mark any inferred items clearly so the user can edit them.
- For the EDUCATION section: if the candidate provided education entries, list them exactly as given (school, degree, field, dates). If none provided, include an Education placeholder line the user can fill in.
- Include a comprehensive Skills section grouped by category (Languages · Frameworks · Tools · Cloud & Platforms · Methodologies · Soft Skills) populated with skills relevant to the target role
- Layout: NAME on first line, contact info on second line, then SUMMARY, SKILLS, EXPERIENCE, PROJECTS (if applicable), EDUCATION
- For every experience entry, put the role, company, and dates on a SINGLE line separated by " | " — e.g. "Software Engineer | Acme Corp | January 2024 – Present". Never put dates on their own line.
- For every education entry, put degree, school, and dates on a SINGLE line separated by " | " — e.g. "B.S. Computer Science | Stanford University | 2018 – 2022".
- Plain text only — no markdown, no tables, no columns, no special characters beyond standard punctuation
- Never invent companies, job titles, or dates that the candidate did not provide
- Keep dates exactly as the candidate provided them

OUTPUT — return ONLY the resume as plain text. No JSON, no markdown fences, no commentary.`;

interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
}

interface Education {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface BuildResumeBody {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  targetRole?: string;
  experiences?: Experience[];
  education?: Education[];
  notes?: string;
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let body: BuildResumeBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), { status: 400 });
  }

  const { fullName, email, phone, location, linkedin, targetRole, experiences, education, notes } = body;

  if (!fullName?.trim() || !targetRole?.trim()) {
    return new Response(
      JSON.stringify({ error: "Full name and target role are required." }),
      { status: 400 },
    );
  }

  const contactParts = [email, phone, location, linkedin].filter((x) => x?.trim());
  const expBlock = (experiences ?? [])
    .filter((e) => e.company?.trim() || e.role?.trim())
    .map(
      (e, i) =>
        `Experience ${i + 1}:\n  Company: ${e.company || "(not provided)"}\n  Role: ${e.role || "(not provided)"}\n  Dates: ${e.startDate || "?"} – ${e.endDate || "Present"}`,
    )
    .join("\n\n");

  const eduBlock = (education ?? [])
    .filter((e) => e.school?.trim() || e.degree?.trim() || e.field?.trim())
    .map(
      (e, i) =>
        `Education ${i + 1}:\n  School: ${e.school || "(not provided)"}\n  Degree: ${e.degree || "(not provided)"}\n  Field: ${e.field || "(not provided)"}\n  Dates: ${e.startDate || "?"} – ${e.endDate || "?"}`,
    )
    .join("\n\n");

  const userMessage = [
    `Build a complete, ATS-optimized resume for this candidate.`,
    ``,
    `CANDIDATE:`,
    `  Name: ${fullName}`,
    contactParts.length ? `  Contact: ${contactParts.join(" | ")}` : `  Contact: (not provided)`,
    ``,
    `TARGET ROLE: ${targetRole}`,
    ``,
    `WORK EXPERIENCE:`,
    expBlock || "(none provided — generate an entry-level resume for the target role)",
    ``,
    `EDUCATION:`,
    eduBlock || "(none provided — include a placeholder line)",
    ``,
    `ADDITIONAL NOTES (projects, achievements, anything else):`,
    notes?.trim() || "(none)",
  ].join("\n");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[build-resume]", err);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: "Failed to build resume. Please try again." })),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
