"use client";

import { useState } from "react";

interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
}

interface BuilderState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  targetRole: string;
  experiences: Experience[];
  notes: string;
}

const BLANK_EXP: Experience = { company: "", role: "", startDate: "", endDate: "" };

const BLANK_STATE: BuilderState = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  targetRole: "",
  experiences: [{ ...BLANK_EXP }],
  notes: "",
};

interface Props {
  defaultEmail?: string;
  onCancel: () => void;
  onSaved: () => void;
}

export default function ResumeBuilder({ defaultEmail, onCancel, onSaved }: Props) {
  const [form, setForm] = useState<BuilderState>({ ...BLANK_STATE, email: defaultEmail ?? "" });
  const [resumeName, setResumeName] = useState("");
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "preview">("form");

  const updateExp = (i: number, patch: Partial<Experience>) => {
    setForm((f) => ({
      ...f,
      experiences: f.experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }));
  };

  const addExp = () => setForm((f) => ({ ...f, experiences: [...f.experiences, { ...BLANK_EXP }] }));

  const removeExp = (i: number) =>
    setForm((f) => ({ ...f, experiences: f.experiences.filter((_, idx) => idx !== i) }));

  const handleGenerate = async () => {
    setError("");
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.targetRole.trim()) { setError("Target job role is required."); return; }

    setGenerating(true);
    setGenerated("");
    setStep("preview");

    try {
      const res = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "Failed to generate resume.");
        setError(msg || "Failed to generate resume.");
        setGenerating(false);
        setStep("form");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setGenerated(acc);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate resume. Please try again.");
      setStep("form");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setError("");
    const name = resumeName.trim() || `${form.targetRole} Resume`;
    if (!generated.trim()) { setError("Generated resume is empty."); return; }

    setSaving(true);
    const res = await fetch("/api/profile/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content: generated }),
    });
    setSaving(false);

    if (res.ok) onSaved();
    else setError((await res.json().catch(() => ({}))).error ?? "Failed to save resume.");
  };

  if (step === "preview") {
    return (
      <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {generating ? "Building your resume..." : "Preview & edit"}
          </h2>
          {!generating && (
            <button onClick={() => setStep("form")} className="text-xs text-gray-500 hover:text-gray-900 font-medium">
              ← Back to inputs
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">Resume Name</label>
          <input
            type="text"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
            placeholder={`${form.targetRole || "My"} Resume`}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Resume Content (edit freely)</label>
            {generating && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-600">
                <div className="w-3 h-3 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                Generating...
              </span>
            )}
          </div>
          <textarea
            value={generated}
            onChange={(e) => setGenerated(e.target.value)}
            rows={18}
            readOnly={generating}
            className="w-full p-3 text-sm font-mono border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || saving}
            className="flex-1 py-2 border border-indigo-200 text-sm font-semibold text-indigo-600 rounded-xl hover:bg-indigo-50 disabled:opacity-60 transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={generating || saving || !generated.trim()}
            className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Generate Resume"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Build a new resume with AI</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Fill in what you have. Even with just your name and target role, we&apos;ll draft something you can edit.
        </p>
      </div>

      {/* Biographics */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Biographics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} placeholder="Jane Doe" />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="jane@example.com" />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(555) 123-4567" />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="San Francisco, CA" />
          <Field label="LinkedIn / Portfolio" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} placeholder="linkedin.com/in/jane" className="sm:col-span-2" />
        </div>
      </section>

      {/* Target role */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Target Role</h3>
        <Field
          label="What job role are you building this resume for? *"
          value={form.targetRole}
          onChange={(v) => setForm({ ...form, targetRole: v })}
          placeholder="e.g. Senior Backend Engineer, Product Manager, Data Scientist"
        />
      </section>

      {/* Experience */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Work Experience</h3>
          <button
            onClick={addExp}
            type="button"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add another
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {form.experiences.map((exp, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Experience {i + 1}</span>
                {form.experiences.length > 1 && (
                  <button
                    onClick={() => removeExp(i)}
                    type="button"
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Company" value={exp.company} onChange={(v) => updateExp(i, { company: v })} placeholder="Acme Corp" small />
                <Field label="Role" value={exp.role} onChange={(v) => updateExp(i, { role: v })} placeholder="Software Engineer" small />
                <Field label="Start date" value={exp.startDate} onChange={(v) => updateExp(i, { startDate: v })} placeholder="Jan 2022" small />
                <Field label="End date" value={exp.endDate} onChange={(v) => updateExp(i, { endDate: v })} placeholder="Present" small />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes (optional)</h3>
        <p className="text-xs text-gray-500 -mt-1">
          Add any projects, achievements, certifications, or details you want included. Leave blank and we&apos;ll generate based on your target role.
        </p>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={5}
          placeholder="e.g. Built an open-source library with 2k stars. Led migration to Kubernetes that cut infra costs 40%. AWS Solutions Architect certified."
          className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </section>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Generate Preview
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
  small,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  small?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className={`${small ? "text-[11px]" : "text-xs"} font-medium text-gray-700`}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}
