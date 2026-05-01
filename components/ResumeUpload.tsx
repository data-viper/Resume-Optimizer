"use client";

import { useRef, useState, useCallback } from "react";

type Mode = "upload" | "paste";

interface Props {
  file: File | null;
  pasteText: string;
  mode: Mode;
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
  onModeChange: (mode: Mode) => void;
}

export default function ResumeUpload({
  file,
  pasteText,
  mode,
  onFileChange,
  onTextChange,
  onModeChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (
        dropped &&
        (dropped.type === "application/pdf" ||
          dropped.name.toLowerCase().endsWith(".docx"))
      ) {
        onFileChange(dropped);
      }
    },
    [onFileChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileChange(selected);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col flex-1 gap-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["upload", "paste"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === m
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "upload" ? "Upload File" : "Paste Text"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all min-h-[220px] ${
            dragging
              ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
              : file
              ? "border-emerald-300 bg-emerald-50 cursor-default"
              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleFileInput}
          />

          {file ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 break-all">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileChange(null);
                }}
                className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drop your resume here
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  or{" "}
                  <span className="text-indigo-500 font-medium">click to browse</span>
                  {" "}· PDF or DOCX
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={pasteText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your resume text here...&#10;&#10;Include all sections: summary, work experience, skills, education, and certifications."
          className="flex-1 w-full min-h-[240px] p-3 text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50/60 leading-relaxed"
        />
      )}
    </div>
  );
}
