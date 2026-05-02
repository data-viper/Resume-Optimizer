"use client";

type LineType = "name" | "contact" | "header" | "bullet" | "role" | "subtitle" | "normal" | "empty";

interface ParsedLine {
  type: LineType;
  text: string;
  rolePart?: string;
  datePart?: string;
}

function parseLines(text: string): ParsedLine[] {
  const raw = text.split("\n");
  const result: ParsedLine[] = [];
  let nameWritten = false;

  for (let i = 0; i < raw.length; i++) {
    const trimmed = raw[i].trim();

    if (!trimmed) {
      result.push({ type: "empty", text: "" });
      continue;
    }

    // Name — first non-empty line
    if (!nameWritten) {
      result.push({ type: "name", text: trimmed });
      nameWritten = true;
      continue;
    }

    // Role / company line with date range — checked FIRST before contact to avoid misclassifying
    // lines like "Senior Engineer | Walmart | Jan 2024 – Present" as contact lines
    const hasDate =
      /\b\d{4}\b/.test(trimmed) &&
      (trimmed.includes("–") || trimmed.includes("—") ||
        / [-–—] /.test(trimmed) || trimmed.includes(" - ") ||
        /present/i.test(trimmed) || /\d{4}\s*[-–—]\s*\d{4}/.test(trimmed));

    if (hasDate) {
      const dateMatch = trimmed.match(
        /(\b(?:\w+ )?\d{4}\s*[–—\-]+\s*(?:\w+ \d{4}|\d{4}|Present))/i
      );
      if (dateMatch) {
        const datePart = dateMatch[0];
        const rolePart = trimmed.replace(datePart, "").replace(/[|·,\s]+$/, "").trim();
        result.push({ type: "role", text: trimmed, rolePart, datePart });
      } else {
        result.push({ type: "role", text: trimmed });
      }
      continue;
    }

    // Contact line
    if (
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("-") &&
      (trimmed.includes("@") || / \| /.test(trimmed) || /\(\d{3}\)/.test(trimmed) ||
        /\d{3}[-.\s]\d{3}/.test(trimmed) || /linkedin\.com/i.test(trimmed))
    ) {
      result.push({ type: "contact", text: trimmed });
      continue;
    }

    // Section header (ALL CAPS)
    const isHeader =
      /^[A-Z][A-Z\s\-\/&]{2,}$/.test(trimmed) &&
      trimmed.length >= 4 &&
      !/\d/.test(trimmed);
    if (isHeader) {
      result.push({ type: "header", text: trimmed });
      continue;
    }

    // Bullet
    if (/^[•\-\*▪·]\s/.test(trimmed)) {
      result.push({ type: "bullet", text: trimmed.replace(/^[•\-\*▪·]\s+/, "") });
      continue;
    }

    // Subtitle — short line immediately after a role/date line
    const prevText = raw[i - 1]?.trim() ?? "";
    const isSubtitle =
      trimmed.length < 80 &&
      !/^[A-Z\s]{4,}$/.test(trimmed) &&
      /\b\d{4}\b/.test(prevText);

    if (isSubtitle) {
      result.push({ type: "subtitle", text: trimmed });
      continue;
    }

    result.push({ type: "normal", text: trimmed });
  }

  return result;
}

export default function ResumePreview({ text }: { text: string }) {
  const lines = parseLines(text);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-auto"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div className="p-8 max-w-[680px] mx-auto" style={{ fontSize: "11px", lineHeight: "1.5" }}>
        {lines.map((line, i) => {
          switch (line.type) {
            case "name":
              return (
                <div key={i} style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginBottom: "4px", fontFamily: "helvetica, Arial, sans-serif" }}>
                  {line.text}
                </div>
              );

            case "contact":
              return (
                <div key={i} style={{ fontSize: "9.5px", color: "#666", marginBottom: "2px", fontFamily: "helvetica, Arial, sans-serif" }}>
                  {line.text}
                </div>
              );

            case "header":
              return (
                <div key={i} style={{ marginTop: "10px", marginBottom: "4px" }}>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#111",
                    letterSpacing: "0.04em",
                    fontFamily: "helvetica, Arial, sans-serif",
                    paddingBottom: "2px",
                    borderBottom: "1.5px solid #111",
                  }}>
                    {line.text}
                  </div>
                </div>
              );

            case "bullet":
              return (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px", paddingLeft: "4px", fontFamily: "helvetica, Arial, sans-serif", fontSize: "10px", color: "#222" }}>
                  <span style={{ flexShrink: 0, marginTop: "1px" }}>•</span>
                  <span>{line.text}</span>
                </div>
              );

            case "role":
              return (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#111",
                  marginTop: "6px",
                  marginBottom: "1px",
                  fontFamily: "helvetica, Arial, sans-serif",
                }}>
                  <span>{line.rolePart ?? line.text}</span>
                  {line.datePart && (
                    <span style={{ flexShrink: 0, marginLeft: "8px" }}>{line.datePart}</span>
                  )}
                </div>
              );

            case "subtitle":
              return (
                <div key={i} style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#111",
                  marginBottom: "2px",
                  fontFamily: "helvetica, Arial, sans-serif",
                }}>
                  {line.text}
                </div>
              );

            case "normal":
              return (
                <div key={i} style={{ fontSize: "10px", color: "#222", marginBottom: "2px", fontFamily: "helvetica, Arial, sans-serif" }}>
                  {line.text}
                </div>
              );

            case "empty":
              return <div key={i} style={{ height: "4px" }} />;

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
