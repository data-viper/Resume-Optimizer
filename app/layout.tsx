import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "ResumeOptimizer — AI-Powered ATS Resume Tailoring",
  description:
    "Tailor your resume to any job description in seconds. 100% ATS-optimized output powered by Claude AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#F8F9FA] antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
