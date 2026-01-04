export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { aboutSchema } from "@/lib/validation";

export async function GET() {
  const about = await prisma.aboutContent.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: about ?? null });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  const parsed = aboutSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid about payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const current = await prisma.aboutContent.findFirst();

  const saved = current
    ? await prisma.aboutContent.update({
        where: { id: current.id },
        data: parsed.data,
      })
    : await prisma.aboutContent.create({
        data: parsed.data,
      });

  return NextResponse.json({ data: saved });
}
