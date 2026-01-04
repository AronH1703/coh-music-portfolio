export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (
    !payload ||
    typeof payload !== "object" ||
    !("ids" in payload) ||
    !Array.isArray((payload as { ids: unknown[] }).ids)
  ) {
    return NextResponse.json({ error: "Expected an array of ids." }, { status: 400 });
  }

  const { ids } = payload as { ids: unknown[] };
  const validIds = ids.filter((id): id is string => typeof id === "string");
  if (!validIds.length) {
    return NextResponse.json({ error: "No valid video ids provided." }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      validIds.map((id, index) =>
        prisma.video.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to persist video order", error);
    return NextResponse.json(
      { error: "Failed to persist video order." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
