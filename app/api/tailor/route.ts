import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an ATS optimization specialist and expert resume writer. Maximize the candidate's ATS score for the target job description.

EXPERIENCE SECTION
- Rewrite every bullet to mirror exact keywords and phrases from the JD
- Add bullets where the JD mentions responsibilities the candidate's role would naturally include
- Lead every bullet with a strong action verb; add metrics where context supports it
- Reorder bullets so the most JD-relevant ones appear first

SKILLS SECTION
- Add every technical skill, tool, framework, and methodology from the JD that fits the candidate's background
- Group clearly: Languages, Frameworks, Tools, Cloud, Methodologies
- Include acronyms AND full names

SUMMARY — rewrite completely: 3-4 sentences mirroring JD language, target job title, key skills, years of experience

CONSTRAINTS
- Never invent a job, company, degree, or certification not in the original resume
- Keep actual job titles, company names, and dates exactly as-is
- Plain text only — no tables, columns, or special characters

OUTPUT — return ONLY valid JSON, no markdown fences:
{"tailored":"complete tailored resume as plain text","atsScore":<0-100>,"matchedKeywords":["..."],"missingKeywords":["..."],"improvements":["..."]}`;

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let resumeText: string, jdText: string;
  try {
    ({ resumeText, jdText } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), { status: 400 });
  }

  if (!resumeText?.trim() || !jdText?.trim()) {
    return new Response(JSON.stringify({ error: "Resume and job description are required." }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: `Tailor this resume for the job description. Return ONLY valid JSON.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`,
            },
          ],
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
        console.error("[tailor]", err);
        controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to tailor resume. Please try again." })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
