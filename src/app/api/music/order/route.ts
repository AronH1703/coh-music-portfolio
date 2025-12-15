import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || !Array.isArray(payload.ids)) {
    return NextResponse.json({ error: "Expected an array of ids." }, { status: 400 });
  }

  const validIds = payload.ids.filter((id): id is string => typeof id === "string");
  if (!validIds.length) {
    return NextResponse.json({ error: "No valid release ids provided." }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      validIds.map((id, index) =>
        prisma.musicRelease.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist release order." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
