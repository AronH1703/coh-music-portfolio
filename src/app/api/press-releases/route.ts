import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { pressReleaseSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

function toDropboxDownloadUrl(value: string): string {
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase();
    if (host === "www.dropbox.com" || host === "dropbox.com") {
      parsed.hostname = "dl.dropboxusercontent.com";
      parsed.search = "";
      return parsed.toString();
    }
    return value.trim();
  } catch {
    return value.trim();
  }
}

function deriveDirectDownloadUrl(
  payload: z.infer<typeof pressReleaseSchema>,
): string | null {
  if (payload.dropboxUrl) {
    return toDropboxDownloadUrl(payload.dropboxUrl);
  }

  if (payload.pdfUrl) {
    return payload.pdfUrl.trim();
  }

  return null;
}

export async function GET() {
  const releases = await prisma.pressRelease.findMany({
    orderBy: [
      { featured: "desc" },
      { date: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ data: releases });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = pressReleaseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid press release data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const releaseDate = new Date(parsed.data.date);
  if (Number.isNaN(releaseDate.getTime())) {
    return NextResponse.json({ error: "Invalid release date." }, { status: 400 });
  }

  const directDownloadUrl = deriveDirectDownloadUrl(parsed.data);

  const release = await prisma.pressRelease.create({
    data: {
      title: parsed.data.title,
      date: releaseDate,
      summary: parsed.data.summary,
      fullContent: parsed.data.fullContent ?? null,
      category: parsed.data.category,
      coverImageUrl: parsed.data.coverImageUrl,
      coverCloudinaryPublicId: parsed.data.coverCloudinaryPublicId ?? null,
      pdfUrl: parsed.data.pdfUrl,
      pdfCloudinaryPublicId: parsed.data.pdfCloudinaryPublicId ?? null,
      dropboxUrl: parsed.data.dropboxUrl,
      directDownloadUrl,
      featured: parsed.data.featured ?? false,
    },
  });

  return NextResponse.json({ data: release }, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload?.id) {
    return NextResponse.json({ error: "Press release id is required." }, { status: 400 });
  }

  const parsed = pressReleaseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid press release data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const releaseDate = new Date(parsed.data.date);
  if (Number.isNaN(releaseDate.getTime())) {
    return NextResponse.json({ error: "Invalid release date." }, { status: 400 });
  }

  const directDownloadUrl = deriveDirectDownloadUrl(parsed.data);

  const updated = await prisma.pressRelease.update({
    where: { id: payload.id },
    data: {
      title: parsed.data.title,
      date: releaseDate,
      summary: parsed.data.summary,
      fullContent: parsed.data.fullContent ?? null,
      category: parsed.data.category,
      coverImageUrl: parsed.data.coverImageUrl,
      coverCloudinaryPublicId: parsed.data.coverCloudinaryPublicId ?? null,
      pdfUrl: parsed.data.pdfUrl,
      pdfCloudinaryPublicId: parsed.data.pdfCloudinaryPublicId ?? null,
      dropboxUrl: parsed.data.dropboxUrl,
      directDownloadUrl,
      featured: parsed.data.featured ?? false,
    },
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json({ error: "Press release not found." }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing press release id." }, { status: 400 });
  }

  const release = await prisma.pressRelease.findUnique({ where: { id } });
  if (!release) {
    return NextResponse.json({ error: "Press release not found." }, { status: 404 });
  }

  await prisma.pressRelease.delete({ where: { id } });

  const deletions: Array<Promise<unknown>> = [];
  if (release.coverCloudinaryPublicId) {
    deletions.push(
      cloudinary.uploader.destroy(release.coverCloudinaryPublicId, {
        resource_type: "image",
      }),
    );
  }
  if (release.pdfCloudinaryPublicId) {
    deletions.push(
      cloudinary.uploader.destroy(release.pdfCloudinaryPublicId, {
        resource_type: "raw",
      }),
    );
  }

  if (deletions.length) {
    await Promise.allSettled(deletions);
  }

  return NextResponse.json({ success: true });
}
