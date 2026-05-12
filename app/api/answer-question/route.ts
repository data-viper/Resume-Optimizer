import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { question, jobTitle, company, tailoredResume } = await req.json();
  if (!question?.trim() || !tailoredResume) {
    return NextResponse.json({ error: "Question and resume are required." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Answer an application question on behalf of a candidate. Use specifics from their resume and tailor to the role.

ROLE: ${jobTitle ?? "the role"} at ${company ?? "the company"}

CANDIDATE RESUME:
${tailoredResume.slice(0, 2000)}

QUESTION:
${question}

RULES:
- 3 to 5 sentences. Concise, confident, first-person ("I").
- Pull 1 specific achievement, project, or skill from the resume when relevant.
- Mirror language from the role/company when natural — never force it.
- No filler ("I am excited to apply", "I believe"), no bullet points, no headings.
- Return ONLY the answer text, no quotes or commentary.`,
        },
      ],
    });

    const answer = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[answer-question]", err);
    return NextResponse.json({ error: "Failed to generate answer." }, { status: 500 });
  }
}
