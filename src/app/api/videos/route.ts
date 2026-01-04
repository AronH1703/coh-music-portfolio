export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { VideoProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { videoSchema } from "@/lib/validation";
import { cloudinary } from "@/lib/cloudinary";

function resolveVideoProvider(data: {
  videoUrl: string;
  videoCloudinaryPublicId?: string | null;
}) {
  if (data.videoCloudinaryPublicId) {
    return {
      provider: VideoProvider.CLOUDINARY,
      externalId: data.videoCloudinaryPublicId,
    };
  }

  try {
    const parsed = new URL(data.videoUrl);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const id =
        parsed.searchParams.get("v") ??
        parsed.pathname.split("/").filter(Boolean).pop();
      if (id) {
        return { provider: VideoProvider.YOUTUBE, externalId: id };
      }
    }
  } catch {
    // ignore
  }

  return {
    provider: VideoProvider.OTHER,
    externalId: data.videoCloudinaryPublicId ?? data.videoUrl,
  };
}

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: videos });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  const parsed = videoSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid video payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const identifiers = resolveVideoProvider(parsed.data);
  const orderAggregate = await prisma.video.aggregate({
    _max: { sortOrder: true },
  });
  const nextSortOrder = (orderAggregate._max.sortOrder ?? -1) + 1;

  const video = await prisma.video.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      videoUrl: parsed.data.videoUrl,
      provider: identifiers.provider,
      externalId: identifiers.externalId,
      thumbnailUrl: parsed.data.thumbnailUrl,
      videoCloudinaryPublicId: parsed.data.videoCloudinaryPublicId,
      thumbnailCloudinaryPublicId: parsed.data.thumbnailCloudinaryPublicId,
      tags: parsed.data.tags,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json({ data: video }, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload?.id) {
    return NextResponse.json({ error: "Video id is required." }, { status: 400 });
  }

  const parsed = videoSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid video update payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const identifiers = resolveVideoProvider(parsed.data);

  const updated = await prisma.video.update({
    where: { id: payload.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      videoUrl: parsed.data.videoUrl,
      provider: identifiers.provider,
      externalId: identifiers.externalId,
      thumbnailUrl: parsed.data.thumbnailUrl,
      videoCloudinaryPublicId: parsed.data.videoCloudinaryPublicId,
      thumbnailCloudinaryPublicId: parsed.data.thumbnailCloudinaryPublicId,
      tags: parsed.data.tags,
    },
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
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
    return NextResponse.json({ error: "Missing video id." }, { status: 400 });
  }

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  await prisma.video.delete({ where: { id } });

  const deletions: Array<Promise<unknown>> = [];

  if (video.videoCloudinaryPublicId) {
    deletions.push(
      cloudinary.uploader.destroy(video.videoCloudinaryPublicId, {
        resource_type: "video",
      }),
    );
  }

  if (video.thumbnailCloudinaryPublicId) {
    deletions.push(
      cloudinary.uploader.destroy(video.thumbnailCloudinaryPublicId, {
        resource_type: "image",
      }),
    );
  }

  if (deletions.length) {
    await Promise.allSettled(deletions);
  }

  return NextResponse.json({ success: true });
}
