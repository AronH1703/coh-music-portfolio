import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { siteLabelsSchema } from "@/lib/validation";

export async function GET() {
  const labels = await prisma.siteLabels.findFirst({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ data: labels ?? null });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = siteLabelsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid labels payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.siteLabels.findFirst();
  const saved = existing
    ? await prisma.siteLabels.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.siteLabels.create({ data: parsed.data });

  return NextResponse.json({ data: saved });
}
