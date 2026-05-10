export async function downloadResumePdf(text: string, filename = "tailored-resume.pdf") {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mX = 20;
  const mY = 20;
  const pageW = 210 - mX * 2;
  const pageH = 297;
  const maxPages = 3;
  let y = mY;

  const newPage = () => {
    if (doc.getNumberOfPages() >= maxPages) return;
    doc.addPage();
    y = mY;
  };
  const space = (need: number) => {
    if (y + need > pageH - mY) newPage();
  };

  const lines = text.split("\n");
  let nameWritten = false;
  let prevWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    if (doc.getNumberOfPages() >= maxPages && y > pageH - mY) break;

    const raw = lines[i];
    const trimmed = raw.trim();

    // Empty line
    if (!trimmed) {
      if (!prevWasEmpty) y += 1.5;
      prevWasEmpty = true;
      continue;
    }
    prevWasEmpty = false;

    // ── Candidate name (first non-empty line) ──
    if (!nameWritten) {
      space(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.text(trimmed, mX, y);
      y += 7;
      nameWritten = true;
      continue;
    }

    // ── Role / company headline — must come BEFORE contact check to avoid
    // misclassifying "Senior Engineer | Walmart | Jan 2024 – Present" as a contact line ──
    const hasDate =
      /\b\d{4}\b/.test(trimmed) &&
      (trimmed.includes("–") || trimmed.includes("—") ||
        / [-–—] /.test(trimmed) || trimmed.includes(" - ") ||
        /present/i.test(trimmed) || /\d{4}\s*[-–—]\s*\d{4}/.test(trimmed));

    if (hasDate) {
      space(7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const dateMatch = trimmed.match(
        /(\b(?:\w+ )?\d{4}\s*[–—\-]+\s*(?:\w+ \d{4}|\d{4}|Present))/i
      );
      if (dateMatch) {
        const datePart = dateMatch[0];
        const rolePart = trimmed.replace(datePart, "").replace(/[|·,\s]+$/, "").trim();
        if (rolePart) doc.text(rolePart, mX, y);
        doc.setFontSize(11);
        const dW = doc.getTextWidth(datePart);
        doc.text(datePart, mX + pageW - dW, y);
      } else {
        const wrapped = doc.splitTextToSize(trimmed, pageW);
        doc.text(wrapped, mX, y);
      }
      y += 5.5;
      continue;
    }

    // ── Contact line (contains @ | / phone) ──
    if (
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("-") &&
      (trimmed.includes("@") || / \| /.test(trimmed) || /\(\d{3}\)/.test(trimmed) ||
        /\d{3}[-.\s]\d{3}/.test(trimmed) || /linkedin\.com/i.test(trimmed))
    ) {
      space(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const wrapped = doc.splitTextToSize(trimmed, pageW);
      doc.text(wrapped, mX, y);
      y += wrapped.length * 4 + 0.5;
      doc.setTextColor(20, 20, 20);
      continue;
    }

    // ── Section header (ALL CAPS, 3+ chars, no lowercase) ──
    const isHeader =
      /^[A-Z][A-Z\s\-\/&]{2,}$/.test(trimmed) &&
      trimmed.length >= 4 &&
      !/\d/.test(trimmed);

    if (isHeader) {
      y += 2;
      space(9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(trimmed, mX, y);
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.5);
      doc.line(mX, y + 1.5, mX + pageW, y + 1.5);
      doc.setDrawColor(200, 200, 200);
      y += 5.5;
      doc.setFontSize(10);
      continue;
    }

    // ── Bullet point ──
    if (/^[•\-\*▪·–]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[•\-\*▪·–]\s+/, "");
      const wrapped = doc.splitTextToSize(content, pageW - 6);
      space(wrapped.length * 4.5 + 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text("•", mX + 1, y);
      doc.text(wrapped, mX + 6, y);
      y += wrapped.length * 4.5 + 0.5;
      continue;
    }

    // ── Sub-line under role (company or title on its own line) ──
    const isSubtitle =
      trimmed.length < 80 &&
      !/^[A-Z\s]{4,}$/.test(trimmed) &&
      i > 0 &&
      /\b\d{4}\b/.test(lines[i - 1] ?? "");

    if (isSubtitle) {
      space(5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(trimmed, mX, y);
      y += 5;
      continue;
    }

    // ── Normal text ──
    space(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const wrapped = doc.splitTextToSize(trimmed, pageW);
    doc.text(wrapped, mX, y);
    y += wrapped.length * 4.5 + 0.5;
  }

  doc.save(filename);
}

export async function downloadCoverLetterPdf(text: string, jobTitle: string, company: string, filename = "cover-letter.pdf") {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mX = 25;
  const mY = 25;
  const pageW = 210 - mX * 2;
  const pageH = 297;
  let y = mY;

  const space = (need: number) => { if (y + need > pageH - mY) { doc.addPage(); y = mY; } };

  // Header: job title + company
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(`${jobTitle} — ${company}`, mX, y);
  y += 6;

  // Thin divider
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.line(mX, y, mX + pageW, y);
  y += 8;

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), mX, y);
  y += 10;

  // Body paragraphs
  doc.setTextColor(20, 20, 20);
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const wrapped = doc.splitTextToSize(trimmed, pageW);
    space(wrapped.length * 5.5 + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(wrapped, mX, y);
    y += wrapped.length * 5.5 + 5;
  }

  doc.save(filename);
}
