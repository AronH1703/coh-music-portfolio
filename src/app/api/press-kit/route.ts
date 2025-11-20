import { NextResponse } from "next/server";
import { pressKitAssetsSchema } from "@/lib/validation";
import { requireAdminSession } from "@/lib/auth";
import { getPressKitAssets, upsertPressKitAssets } from "@/lib/press-kit";

export async function GET() {
  const data = await getPressKitAssets();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Missing request body." }, { status: 400 });
  }

  const parsed = pressKitAssetsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid press kit data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await upsertPressKitAssets(parsed.data);
  return NextResponse.json({ data: updated });
}
