import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { contactSchema } from "@/lib/validation";

export async function GET() {
  const contact = await prisma.contactProfile.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: contact ?? null });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid contact profile payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const current = await prisma.contactProfile.findFirst();

  const saved = current
    ? await prisma.contactProfile.update({
        where: { id: current.id },
        data: parsed.data,
      })
    : await prisma.contactProfile.create({
        data: parsed.data,
      });

  return NextResponse.json({ data: saved });
}
