import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import type { NewsletterSubscriber } from "@prisma/client";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "asc" },
  });

  const header = "email,created_at,source";
  const rows = subscribers.map((subscriber: NewsletterSubscriber) =>
    [
      subscriber.email,
      subscriber.createdAt.toISOString(),
      subscriber.source ?? "",
    ]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"',
    },
  });
}
