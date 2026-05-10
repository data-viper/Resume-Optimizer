import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { jobTitle, company, tailoredResume } = await req.json();
  if (!jobTitle || !company || !tailoredResume) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Write a professional cover letter for the following role.

JOB: ${jobTitle} at ${company}

CANDIDATE RESUME (use specific achievements, skills, and experience from this):
${tailoredResume.slice(0, 2000)}

RULES:
- 4 paragraphs: opening (role + hook), value paragraph 1 (technical skills/achievements), value paragraph 2 (impact/soft skills), closing (CTA)
- Pull 2–3 specific achievements or metrics from the resume
- Mirror the language and keywords from the job title
- Professional but not stiff — confident tone
- Under 350 words total
- Use [Your Name] for the candidate name
- Start directly with "Dear Hiring Manager," — no subject line, no address block
- End with "Sincerely,\n[Your Name]"
- Return ONLY the cover letter text, no JSON, no extra commentary`,
        },
      ],
    });

    const coverLetter = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error("[draft-cover-letter]", err);
    return NextResponse.json({ error: "Failed to generate cover letter." }, { status: 500 });
  }
}
