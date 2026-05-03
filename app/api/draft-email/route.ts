import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { jobTitle, company, recruiterEmail, tailoredResume } = await req.json();
  if (!jobTitle || !company || !tailoredResume) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Draft a concise, professional cold outreach email to a recruiter for the following role.

JOB: ${jobTitle} at ${company}
RECRUITER EMAIL: ${recruiterEmail || "recruiter@company.com"}

CANDIDATE RESUME SUMMARY (use this to personalise — pull out 2-3 specific achievements or skills that are most relevant to the role):
${tailoredResume.slice(0, 1500)}

RULES:
- Subject line: short, specific, not generic ("Application for ${jobTitle} – [Candidate Name]" style)
- Email body: 3 short paragraphs max. Opening hook, 2-3 specific value points from the resume, clear CTA.
- Do NOT use "I hope this email finds you well" or other filler openers.
- Keep the whole email under 150 words.
- Use [Your Name] as placeholder for the candidate's name.
- Return ONLY valid JSON, no markdown: {"subject":"...","body":"..."}`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const { subject, body } = JSON.parse(cleaned);

    return NextResponse.json({ subject, body });
  } catch (err) {
    console.error("[draft-email]", err);
    return NextResponse.json({ error: "Failed to draft email." }, { status: 500 });
  }
}
