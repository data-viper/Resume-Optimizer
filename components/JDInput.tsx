"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const MAX = 8000;

export default function JDInput({ value, onChange }: Props) {
  return (
    <div className="flex flex-col flex-1 gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder={`Paste the full job description here...\n\nExample:\nWe're looking for a Senior Engineer with 5+ years in React, Node.js, and TypeScript. You'll design scalable systems, mentor junior engineers, and work closely with product and design...`}
        className="flex-1 w-full min-h-[280px] p-3 text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-gray-50/60 leading-relaxed"
      />
      <div className="flex justify-end">
        <span
          className={`text-xs tabular-nums transition-colors ${
            value.length > MAX * 0.9
              ? "text-amber-500"
              : "text-gray-300"
          }`}
        >
          {value.length.toLocaleString()} / {MAX.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
