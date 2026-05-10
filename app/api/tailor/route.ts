import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an elite ATS optimization specialist. Your job is to tailor a resume so aggressively that it genuinely scores 92–98 on ATS systems — not by faking numbers, but by doing the work.

EXPERIENCE SECTION — be exhaustive
- Rewrite EVERY bullet to mirror exact keywords, phrases, and terminology from the JD
- Add new bullets for any responsibility mentioned in the JD that the candidate's role would naturally involve but isn't listed — infer realistically from their job title and industry
- Every bullet must start with a strong action verb (Led, Built, Designed, Automated, Reduced, Increased, Delivered, Owned)
- Add metrics wherever plausible (team size, % improvement, scale, frequency)
- Put the most JD-relevant bullets first in each role

SKILLS SECTION — be comprehensive
- Include every single technical skill, tool, framework, platform, and methodology from the JD that plausibly fits the candidate's background
- Add both acronym and full name (e.g. "CI/CD (Continuous Integration/Continuous Delivery)")
- Group: Languages · Frameworks · Tools · Cloud & Platforms · Methodologies · Soft Skills

SUMMARY — rewrite completely
- 3–4 sentences using the JD's exact language
- Name the target job title, key required skills, and years of relevant experience

SCORING — score the TAILORED resume, not the original
- atsScore reflects how well your finished tailored resume matches the JD
- After aggressive tailoring, this should genuinely be 92–98
- If you would score it below 90, go back and add more relevant keywords and bullets until it earns a higher score — do not settle

CONSTRAINTS
- Never invent a job, company, degree, or certification not in the original resume
- Keep actual job titles, company names, and dates exactly as-is
- Plain text only — no tables, columns, or special characters
- Do NOT add a headline, tagline, target-role line, or pipe-separated list of job titles under the candidate's name. The line directly below the name must be the contact info only — nothing else.

OUTPUT — return ONLY valid JSON, no markdown fences:
{"tailored":"complete tailored resume as plain text","atsScore":<0-100>,"jobTitle":"extracted job title from JD","company":"extracted company name from JD","matchedKeywords":["..."],"missingKeywords":["..."],"improvements":["..."]}`;

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
