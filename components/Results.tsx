"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadResumePdf } from "@/lib/generatePdf";
import ResumePreview from "./ResumePreview";

export interface TailorResult {
  tailored: string;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  improvements: string[];
}

interface Props {
  result: TailorResult;
  onBack: () => void;
}

export default function Results({ result, onBack }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.tailored);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePdfDownload = async () => {
    setDownloading(true);
    await downloadResumePdf(result.tailored, "tailored-resume.pdf");
    setDownloading(false);
  };

  const score = result.atsScore ?? 0;
  const scoreColor =
    score >= 80
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : score >= 60
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-red-600 bg-red-50 border-red-200";
  const scoreLabel = score >= 80 ? "Strong Match" : score >= 60 ? "Good Match" : "Needs Work";

  return (
    <div className="flex flex-col flex-1 gap-5">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Edit Inputs
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${scoreColor}`}>
            <span className="text-lg font-bold">{score}</span>
            <span className="text-xs font-medium opacity-75">/ 100 · {scoreLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              copied
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Text
              </>
            )}
          </button>

          <button
            onClick={handlePdfDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-all"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Tailored resume */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3">
            <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Tailored Resume</h2>
            <span className="text-xs text-gray-400 ml-auto">Preview matches PDF output</span>
          </div>
          <ResumePreview text={result.tailored} />
        </div>

        {/* Insights sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold text-gray-800">
                Matched Keywords
                <span className="ml-1.5 text-emerald-600">({result.matchedKeywords?.length ?? 0})</span>
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.matchedKeywords?.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {result.missingKeywords?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-amber-50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-800">
                  Missing Keywords
                  <span className="ml-1.5 text-amber-600">({result.missingKeywords.length})</span>
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400">Add these only if you genuinely have experience with them.</p>
            </div>
          )}

          {result.improvements?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-800">What Changed</h3>
              </div>
              <ul className="flex flex-col gap-1.5">
                {result.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="text-indigo-400 mt-0.5 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
