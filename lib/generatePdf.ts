export async function downloadResumePdf(text: string, filename = "tailored-resume.pdf") {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mX = 20;
  const mY = 22;
  const pageW = 210 - mX * 2;
  const pageH = 297;
  let y = mY;

  const newPage = () => { doc.addPage(); y = mY; };
  const space = (need: number) => { if (y + need > pageH - mY) newPage(); };

  const lines = text.split("\n");
  let nameWritten = false;
  let prevWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Empty line
    if (!trimmed) {
      if (!prevWasEmpty) y += 2.5;
      prevWasEmpty = true;
      continue;
    }
    prevWasEmpty = false;

    // ── Candidate name (first non-empty line) ──
    if (!nameWritten) {
      space(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(20, 20, 20);
      doc.text(trimmed, mX, y);
      y += 9;
      nameWritten = true;
      continue;
    }

    // ── Contact / summary line (contains @ | / phone) ──
    if (
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("-") &&
      (trimmed.includes("@") || / \| /.test(trimmed) || /\(\d{3}\)/.test(trimmed) ||
        /\d{3}[-.\s]\d{3}/.test(trimmed) || /linkedin\.com/i.test(trimmed))
    ) {
      space(7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const wrapped = doc.splitTextToSize(trimmed, pageW);
      doc.text(wrapped, mX, y);
      y += wrapped.length * 4.5 + 1;
      doc.setTextColor(20, 20, 20);
      continue;
    }

    // ── Section header (ALL CAPS, 3+ chars, no lowercase) ──
    const isHeader =
      /^[A-Z][A-Z\s\-\/&]{2,}$/.test(trimmed) &&
      trimmed.length >= 4 &&
      !/\d/.test(trimmed);

    if (isHeader) {
      y += 3;
      space(11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(trimmed, mX, y);
      // Accent underline
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.6);
      doc.line(mX, y + 1.8, mX + pageW, y + 1.8);
      doc.setDrawColor(200, 200, 200);
      y += 7;
      doc.setFontSize(10);
      continue;
    }

    // ── Bullet point ──
    if (/^[•\-\*▪·–]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[•\-\*▪·–]\s+/, "");
      const wrapped = doc.splitTextToSize(content, pageW - 7);
      space(wrapped.length * 5 + 1.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text("•", mX + 1, y);
      doc.text(wrapped, mX + 7, y);
      y += wrapped.length * 5 + 1;
      continue;
    }

    // ── Role / company line with date (bold) ──
    const hasDate =
      /\d{4}/.test(trimmed) &&
      (trimmed.includes("–") || trimmed.includes("—") || trimmed.includes(" - ") ||
        /present/i.test(trimmed));

    if (hasDate) {
      space(7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      // Split role and date to opposite ends
      const datePart = trimmed.match(
        /(\w+ \d{4}\s*[–—-]\s*(?:\w+ \d{4}|Present))/i
      )?.[0];
      if (datePart) {
        const rolePart = trimmed.replace(datePart, "").replace(/[|·,\s]+$/, "").trim();
        doc.text(rolePart, mX, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const dW = doc.getTextWidth(datePart);
        doc.text(datePart, mX + pageW - dW, y);
        doc.setTextColor(20, 20, 20);
      } else {
        const wrapped = doc.splitTextToSize(trimmed, pageW);
        doc.text(wrapped, mX, y);
      }
      y += 5.5;
      continue;
    }

    // ── Italic-style sub-line (title under company, no date) ──
    // Heuristic: short line, follows a bold line, not ALL CAPS
    const isSubtitle =
      trimmed.length < 80 &&
      !/^[A-Z\s]{4,}$/.test(trimmed) &&
      i > 0 &&
      /\d{4}/.test(lines[i - 1] ?? "");

    if (isSubtitle) {
      space(6);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(trimmed, mX, y);
      y += 5;
      doc.setTextColor(20, 20, 20);
      continue;
    }

    // ── Normal text ──
    space(7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const wrapped = doc.splitTextToSize(trimmed, pageW);
    doc.text(wrapped, mX, y);
    y += wrapped.length * 5 + 1;
  }

  doc.save(filename);
}
