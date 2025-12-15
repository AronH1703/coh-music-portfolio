import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { newsletterSubscriptionSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: subscribers });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parsed = newsletterSubscriptionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        source: parsed.data.source,
      },
    });

    return NextResponse.json({ data: subscriber }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Email is already subscribed." },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing subscriber id." }, { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });

  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  }

  await prisma.newsletterSubscriber.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
