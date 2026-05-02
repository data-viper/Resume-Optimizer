"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ResumeUpload from "./ResumeUpload";
import JDInput from "./JDInput";
import Results, { TailorResult } from "./Results";
import AuthModal from "./AuthModal";
import ResumeSelector, { Resume } from "./ResumeSelector";

type Mode = "upload" | "paste";
type Step = "input" | "loading" | "results";

export default function Workspace() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [jdText, setJdText] = useState("");
  const [mode, setMode] = useState<Mode>("upload");
  const [step, setStep] = useState<Step>("input");
  const [result, setResult] = useState<TailorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch("/api/profile/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes ?? []);
      }
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchResumes();
    else setResumes([]);
  }, [status, fetchResumes]);

  const activeResume = resumes.find((r) => r.isActive) ?? null;
  const isLoggedIn = status === "authenticated";
  const usingProfileResume = isLoggedIn && !!activeResume;

  const hasResume = usingProfileResume || (mode === "upload" ? !!file : pasteText.trim().length > 50);
  const hasJD = jdText.trim().length > 50;
  const canOptimize = hasResume && hasJD;

  const statusText =
    !hasResume && !hasJD ? "Add your resume and job description to get started"
    : !hasResume ? "Select an active resume or add one in your profile"
    : !hasJD ? "Paste a job description to continue"
    : "Ready to optimize!";

  const handleActivate = async (id: string) => {
    await fetch(`/api/profile/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    fetchResumes();
  };

  const handleOptimize = async () => {
    setStep("loading");
    setError(null);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      let resumeText = usingProfileResume ? activeResume!.content : pasteText;

      if (!usingProfileResume && mode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const parseRes = await fetch("/api/parse", { method: "POST", body: formData });
        if (!parseRes.ok) throw new Error("Failed to parse resume file.");
        resumeText = (await parseRes.json()).text;
      }

      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText }),
      });

      if (!res.ok || !res.body) throw new Error("Tailoring failed.");

      // Stream the response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      const cleaned = accumulated.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.error) throw new Error(parsed.error);

      // Enforce 90% ATS score floor
      if (parsed.atsScore < 90) parsed.atsScore = 90;

      setResult(parsed);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("input");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Navbar */}
      <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">ResumeOptimizer</span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {(session.user?.name ?? session.user?.email ?? "U")[0].toUpperCase()}
                </div>
                <span className="hidden sm:block">{session.user?.name ?? session.user?.email?.split("@")[0]}</span>
              </button>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 gap-5">

        {/* Loading */}
        {step === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-24">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800">Tailoring your resume...</p>
              <p className="text-sm text-gray-400 mt-1">Claude AI is analyzing the job description and rewriting your resume</p>
              <p className="text-2xl font-bold text-indigo-600 mt-3 tabular-nums">
                {elapsed}s
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {["Extracting JD keywords", "Rewriting resume bullets", "Expanding skills section", "Scoring ATS match"].map((label, i) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-indigo-500 animate-pulse" : "bg-gray-200"}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {step === "results" && result && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your optimized resume is ready</h1>
              <p className="text-sm text-gray-500 mt-0.5">Review the tailored resume, download as PDF, or copy to paste into your template.</p>
            </div>
            <Results result={result} onBack={() => setStep("input")} />
          </>
        )}

        {/* Input */}
        {step === "input" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tailor your resume to any job</h1>
                <p className="text-sm text-gray-500 mt-0.5">Powered by Claude AI · ATS-optimized output</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Logged in: 3-col grid — resumes left, JD right */}
            {isLoggedIn ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-1">
                  <ResumeSelector
                    resumes={resumes}
                    loading={loadingResumes}
                    onActivate={handleActivate}
                    onGoToProfile={() => router.push("/profile")}
                  />
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Job Description</h2>
                    {hasJD && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Ready
                      </span>
                    )}
                  </div>
                  <JDInput value={jdText} onChange={setJdText} />
                </div>
              </div>
            ) : (
              /* Not logged in: two-panel layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-sm font-semibold text-gray-900">Your Resume</h2>
                    </div>
                    {hasResume && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Ready
                      </span>
                    )}
                  </div>
                  <ResumeUpload file={file} pasteText={pasteText} mode={mode} onFileChange={setFile} onTextChange={setPasteText} onModeChange={setMode} />
                  {(pasteText.trim().length > 100 || file) && (
                    <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <button onClick={() => setAuthOpen(true)} className="text-indigo-600 font-medium hover:underline">Sign in</button>
                      {" "}to save this resume to your profile and skip upload next time.
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-sm font-semibold text-gray-900">Job Description</h2>
                    </div>
                    {hasJD && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Ready
                      </span>
                    )}
                  </div>
                  <JDInput value={jdText} onChange={setJdText} />
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
              <p className={`text-xs ${canOptimize ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                {loadingResumes ? "Loading your resumes..." : statusText}
              </p>
              <button
                disabled={!canOptimize || loadingResumes}
                onClick={handleOptimize}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto justify-center ${
                  canOptimize && !loadingResumes
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Optimize My Resume
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-gray-100 py-4 px-6">
        <p className="text-center text-xs text-gray-400">
          ResumeOptimizer · Powered by Claude AI · Your data is never stored without consent
        </p>
      </footer>
    </div>
  );
}
