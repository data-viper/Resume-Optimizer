import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, isActive: true, createdAt: true, content: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ resumes });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, content } = await req.json();
  if (!name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Name and content are required." }, { status: 400 });
  }

  // If this is the first resume, make it active
  const count = await prisma.resume.count({ where: { userId: session.user.id } });
  const resume = await prisma.resume.create({
    data: { userId: session.user.id, name: name.trim(), content, isActive: count === 0 },
  });

  return NextResponse.json({ resume });
}
