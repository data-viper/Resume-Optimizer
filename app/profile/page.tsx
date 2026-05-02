"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Resume } from "@/components/ResumeSelector";

type Mode = "upload" | "paste";
type Tab = "resumes" | "tracker";

interface EditingState {
  id: string | null;
  name: string;
  content: string;
  mode: Mode;
  file: File | null;
}

interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  atsScore: number;
  resumeName: string | null;
  appliedAt: string;
}

const BLANK: EditingState = { id: null, name: "", content: "", mode: "paste", file: null };

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("resumes");

  // ── Resumes ──
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Applications ──
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [deletingApp, setDeletingApp] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [appSaving, setAppSaving] = useState(false);

  const fetchResumes = useCallback(async () => {
    setLoadingResumes(true);
    const res = await fetch("/api/profile/resumes");
    if (res.ok) setResumes((await res.json()).resumes);
    setLoadingResumes(false);
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    const res = await fetch("/api/profile/applications");
    if (res.ok) setApplications((await res.json()).applications);
    setLoadingApps(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated") { fetchResumes(); fetchApplications(); }
  }, [status, router, fetchResumes, fetchApplications]);

  // ── Resume handlers ──
  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");

    let content = editing.content;

    if (editing.mode === "upload" && editing.file) {
      const formData = new FormData();
      formData.append("file", editing.file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      if (!res.ok) { setError("Failed to parse file."); setSaving(false); return; }
      content = (await res.json()).text;
    }

    if (!editing.name.trim()) { setError("Resume name is required."); setSaving(false); return; }
    if (!content.trim()) { setError("Resume content is required."); setSaving(false); return; }

    const url = editing.id ? `/api/profile/resumes/${editing.id}` : "/api/profile/resumes";
    const method = editing.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name, content }),
    });

    setSaving(false);
    if (res.ok) { setEditing(null); fetchResumes(); }
    else setError((await res.json()).error ?? "Failed to save.");
  };

  const handleActivate = async (id: string) => {
    await fetch(`/api/profile/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    fetchResumes();
  };

  const handleDeleteResume = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/profile/resumes/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchResumes();
  };

  // ── Application handlers ──
  const handleDeleteApp = async (id: string) => {
    setDeletingApp(id);
    await fetch(`/api/profile/applications/${id}`, { method: "DELETE" });
    setDeletingApp(null);
    fetchApplications();
  };

  const handleSaveApp = async () => {
    if (!editingApp) return;
    setAppSaving(true);
    await fetch(`/api/profile/applications/${editingApp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle: editingApp.jobTitle, company: editingApp.company }),
    });
    setAppSaving(false);
    setEditingApp(null);
    fetchApplications();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.push("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">ResumeOptimizer</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">Sign out</button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([["resumes", "My Resumes"], ["tracker", "Application Tracker"]] as [Tab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── RESUMES TAB ── */}
        {activeTab === "resumes" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Resumes</h1>
                <p className="text-sm text-gray-500 mt-0.5">Save multiple resumes and switch between them on the optimizer.</p>
              </div>
              {!editing && (
                <button onClick={() => setEditing({ ...BLANK })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Resume
                </button>
              )}
            </div>

            {editing && (
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-900">{editing.id ? "Edit Resume" : "Add New Resume"}</h2>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Resume Name</label>
                  <input type="text" value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Senior Engineer, ML Specialist"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {(["paste", "upload"] as Mode[]).map((m) => (
                      <button key={m} onClick={() => setEditing({ ...editing, mode: m, file: null })}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editing.mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        {m === "paste" ? "Paste Text" : "Upload File"}
                      </button>
                    ))}
                  </div>
                  {editing.mode === "paste" ? (
                    <textarea value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      placeholder="Paste your resume text here..."
                      rows={10}
                      className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  ) : (
                    <div onClick={() => document.getElementById("resume-file-input")?.click()}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-indigo-300 hover:bg-gray-50 transition-colors">
                      <input id="resume-file-input" type="file" accept=".pdf,.docx" className="hidden"
                        onChange={(e) => setEditing({ ...editing, file: e.target.files?.[0] ?? null })} />
                      {editing.file
                        ? <p className="text-sm font-medium text-emerald-700">{editing.file.name}</p>
                        : <><p className="text-sm font-medium text-gray-700">Click to upload PDF or DOCX</p>
                            <p className="text-xs text-gray-400 mt-1">File content will be extracted automatically</p></>
                      }
                    </div>
                  )}
                </div>
                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(null); setError(""); }}
                    className="flex-1 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    {saving ? "Saving..." : "Save Resume"}
                  </button>
                </div>
              </div>
            )}

            {loadingResumes ? (
              <div className="flex flex-col gap-3">
                {[1,2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}
              </div>
            ) : resumes.length === 0 && !editing ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">No resumes yet</p>
                <button onClick={() => setEditing({ ...BLANK })}
                  className="mt-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                  + Add Resume
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {resumes.map((resume) => (
                  <div key={resume.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 transition-all ${resume.isActive ? "border-indigo-200 ring-1 ring-indigo-100" : "border-gray-200"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${resume.isActive ? "bg-indigo-100" : "bg-gray-100"}`}>
                      <svg className={`w-5 h-5 ${resume.isActive ? "text-indigo-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{resume.name}</p>
                        {resume.isActive && <span className="shrink-0 px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded-full">Active</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{resume.content.length.toLocaleString()} characters</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!resume.isActive && (
                        <button onClick={() => handleActivate(resume.id)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                          Set Active
                        </button>
                      )}
                      <button onClick={() => setEditing({ id: resume.id, name: resume.name, content: resume.content, mode: "paste", file: null })}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteResume(resume.id)} disabled={deleting === resume.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                        {deleting === resume.id
                          ? <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-red-500 animate-spin" />
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── APPLICATION TRACKER TAB ── */}
        {activeTab === "tracker" && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Application Tracker</h1>
              <p className="text-sm text-gray-500 mt-0.5">Automatically logged every time you optimize a resume.</p>
            </div>

            {loadingApps ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-12 bg-gray-50 border-b border-gray-100 animate-pulse" />
                {[1,2,3].map(i => <div key={i} className="h-14 border-b border-gray-50 animate-pulse" />)}
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">No applications tracked yet</p>
                <p className="text-xs text-gray-400">Optimize a resume to automatically log your first application.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Edit inline row */}
                {editingApp && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                    <input value={editingApp.jobTitle}
                      onChange={(e) => setEditingApp({ ...editingApp, jobTitle: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <input value={editingApp.company}
                      onChange={(e) => setEditingApp({ ...editingApp, company: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <button onClick={handleSaveApp} disabled={appSaving}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                      {appSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditingApp(null)} className="px-3 py-1 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                )}

                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Job Title</span>
                  <span>Company</span>
                  <span>ATS Score</span>
                  <span>Resume Used</span>
                  <span>Date</span>
                </div>

                {/* Rows */}
                {applications.map((app) => (
                  <div key={app.id}
                    className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition-colors group">
                    <span className="text-sm font-medium text-gray-900 truncate">{app.jobTitle}</span>
                    <span className="text-sm text-gray-600 truncate">{app.company}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                      app.atsScore >= 90 ? "bg-emerald-50 text-emerald-700" :
                      app.atsScore >= 70 ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>{app.atsScore}%</span>
                    <span className="text-xs text-gray-400 truncate">{app.resumeName ?? "—"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={() => setEditingApp(app)}
                          className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteApp(app.id)} disabled={deletingApp === app.id}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                          {deletingApp === app.id
                            ? <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-red-500 animate-spin" />
                            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-400">{applications.length} application{applications.length !== 1 ? "s" : ""} tracked</p>
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Go optimize a resume
        </button>
      </main>
    </div>
  );
}
