import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobTitle, company, atsScore, resumeName } = await req.json();
  if (!jobTitle?.trim() || !company?.trim()) {
    return NextResponse.json({ error: "jobTitle and company are required." }, { status: 400 });
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId: session.user.id,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      atsScore: atsScore ?? 0,
      resumeName: resumeName ?? null,
    },
  });

  return NextResponse.json({ application });
}
