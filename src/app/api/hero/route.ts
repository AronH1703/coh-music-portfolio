import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { heroSchema } from "@/lib/validation";

export async function GET() {
  const hero = await prisma.hero.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    data: hero ?? null,
  });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  const parsed = heroSchema.safeParse(payload);

  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Invalid hero payload", issues }, { status: 400 });
  }

  const hero = await prisma.hero.findFirst();

  const result = hero
    ? await prisma.hero.update({
        where: { id: hero.id },
        data: parsed.data,
      })
    : await prisma.hero.create({
        data: parsed.data,
      });

  return NextResponse.json({ data: result });
}
