import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { musicReleaseSchema } from "@/lib/validation";
import { cloudinary } from "@/lib/cloudinary";
import { dayjs } from "@/lib/dayjs";

function deriveReleaseDateTimes(data: {
  releaseDate?: string;
  releaseTime?: string;
  timeZone?: string;
  comingSoon?: boolean;
}) {
  if (!data.releaseDate) {
    return { releaseDate: null, releaseAt: null, comingSoon: data.comingSoon ?? true };
  }

  const base = dayjs(data.releaseDate);
  if (!base.isValid()) {
    throw new Error("Invalid release date.");
  }

  let releaseAt = base;

  if (data.releaseTime) {
    const time = data.releaseTime.padStart(5, "0");
    const [hours, minutes] = time.split(":").map(Number);
    releaseAt = releaseAt.hour(hours ?? 0).minute(minutes ?? 0);
  }

  if (data.timeZone) {
    const zoned = dayjs.tz(
      `${base.format("YYYY-MM-DD")} ${data.releaseTime ?? "00:00"}`,
      data.timeZone,
    );
    if (zoned.isValid()) {
      releaseAt = zoned;
    }
  }

  const releaseDate = base.startOf("day").toDate();
  const releaseDateTime = releaseAt.toDate();

  const now = dayjs();
  const comingSoon =
    data.comingSoon ?? (releaseDateTime.getTime() > now.toDate().getTime());

  return { releaseDate, releaseAt: releaseDateTime, comingSoon };
}

export async function GET() {
  const releases = await prisma.musicRelease.findMany({
    orderBy: [
      { sortOrder: "asc" },
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

  const parsed = musicReleaseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid music release payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  let releaseDates;
  try {
    releaseDates = deriveReleaseDateTimes(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  try {
    const release = await prisma.musicRelease.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        streamingLinks: parsed.data.streamingLinks,
        coverImageUrl: parsed.data.coverImageUrl,
        coverImageAlt: parsed.data.coverImageAlt,
        coverCloudinaryPublicId: parsed.data.coverCloudinaryPublicId ?? payload?.cloudinaryPublicId,
        audioUrl: parsed.data.audioUrl,
        audioCloudinaryPublicId: parsed.data.audioCloudinaryPublicId,
        releaseDate: releaseDates.releaseDate,
        releaseTime: parsed.data.releaseTime,
        timeZone: parsed.data.timeZone,
        releaseAt: releaseDates.releaseAt,
        comingSoon: releaseDates.comingSoon,
        genre: parsed.data.genre,
        duration: parsed.data.duration,
        credits: parsed.data.credits,
        featured: parsed.data.featured ?? false,
        metaTitle: parsed.data.metaTitle,
        metaDescription: parsed.data.metaDescription,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ data: release }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload?.id) {
    return NextResponse.json({ error: "Music release id is required." }, { status: 400 });
  }

  const parsed = musicReleaseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid release update payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  let releaseDates;
  try {
    releaseDates = deriveReleaseDateTimes(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  const updated = await prisma.musicRelease.update({
    where: { id: payload.id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      streamingLinks: parsed.data.streamingLinks,
      coverImageUrl: parsed.data.coverImageUrl,
      coverImageAlt: parsed.data.coverImageAlt,
      coverCloudinaryPublicId: parsed.data.coverCloudinaryPublicId ?? payload?.cloudinaryPublicId,
      audioUrl: parsed.data.audioUrl,
      audioCloudinaryPublicId: parsed.data.audioCloudinaryPublicId,
      releaseDate: releaseDates.releaseDate,
      releaseTime: parsed.data.releaseTime,
      timeZone: parsed.data.timeZone,
      releaseAt: releaseDates.releaseAt,
      comingSoon: releaseDates.comingSoon,
      genre: parsed.data.genre,
      duration: parsed.data.duration,
      credits: parsed.data.credits,
      featured: parsed.data.featured ?? false,
      metaTitle: parsed.data.metaTitle,
      metaDescription: parsed.data.metaDescription,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json({ error: "Music release not found." }, { status: 404 });
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
    return NextResponse.json({ error: "Missing music release id." }, { status: 400 });
  }

  const release = await prisma.musicRelease.findUnique({ where: { id } });

  if (!release) {
    return NextResponse.json({ error: "Music release not found." }, { status: 404 });
  }

  await prisma.musicRelease.delete({ where: { id } });

  const deletions: Array<Promise<unknown>> = [];

  if (release.coverCloudinaryPublicId) {
    deletions.push(
      cloudinary.uploader.destroy(release.coverCloudinaryPublicId, {
        resource_type: "image",
      }),
    );
  }

  if (release.audioCloudinaryPublicId) {
    deletions.push(
      cloudinary.uploader.destroy(release.audioCloudinaryPublicId, {
        resource_type: "video",
      }),
    );
  }

  if (deletions.length) {
    await Promise.allSettled(deletions);
  }

  return NextResponse.json({ success: true });
}
