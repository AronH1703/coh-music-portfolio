import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { Readable } from "stream";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { galleryItemSchema } from "@/lib/validation";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function GET() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds 5 MB limit." },
      { status: 400 },
    );
  }

  const tagsField = formData.get("tags");
  let tags: string[] | undefined;
  if (typeof tagsField === "string" && tagsField.trim().length > 0) {
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) {
        tags = parsed.filter((tag) => typeof tag === "string").map((tag) => tag.trim());
      }
    } catch {
      return NextResponse.json(
        { error: "Tags must be provided as a JSON array of strings." },
        { status: 400 },
      );
    }
  }

  const metadata = galleryItemSchema.safeParse({
    title: formData.get("title"),
    caption:
      typeof formData.get("caption") === "string" &&
      (formData.get("caption") as string).trim().length > 0
        ? (formData.get("caption") as string)
        : undefined,
    altText:
      typeof formData.get("altText") === "string" &&
      (formData.get("altText") as string).trim().length > 0
        ? (formData.get("altText") as string)
        : undefined,
    category:
      typeof formData.get("category") === "string" &&
      (formData.get("category") as string).trim().length > 0
        ? (formData.get("category") as string)
        : undefined,
    tags,
    sortOrder: formData.get("sortOrder")
      ? Number(formData.get("sortOrder"))
      : undefined,
  });

  if (!metadata.success) {
    return NextResponse.json(
      {
        error: "Invalid gallery item metadata.",
        issues: metadata.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = (file as File).type || "image/jpeg";

  let uploadResult = await new Promise<{
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "coh-music/gallery",
        resource_type: "image",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Unknown Cloudinary error"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width ?? 0,
          height: result.height ?? 0,
        });
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  }).catch((error: unknown) => {
    console.error("Cloudinary upload failed (stream)", error);
    return null;
  });

  // Fallback: try base64 data URI upload if stream failed (some envs have stream issues)
  if (!uploadResult) {
    try {
      const base64 = buffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "coh-music/gallery",
        resource_type: "image",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      });
      uploadResult = {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width ?? 0,
        height: result.height ?? 0,
      };
    } catch (err) {
      console.error("Cloudinary upload failed (data-uri)", err);
    }
  }

  if (!uploadResult) {
    return NextResponse.json(
      { error: "Failed to upload image to Cloudinary. Check server logs for details." },
      { status: 500 },
    );
  }

  const item = await prisma.galleryItem.create({
    data: {
      title: metadata.data.title,
      caption: metadata.data.caption,
      altText: metadata.data.altText,
      category: metadata.data.category,
      tags: metadata.data.tags,
      sortOrder: metadata.data.sortOrder ?? 0,
      imageUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload?.id) {
    return NextResponse.json({ error: "Gallery item id is required." }, { status: 400 });
  }

  const parsed = galleryItemSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid gallery item update.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.galleryItem.update({
    where: { id: payload.id },
    data: {
      title: parsed.data.title,
      caption: parsed.data.caption,
      altText: parsed.data.altText,
      category: parsed.data.category,
      tags: parsed.data.tags,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json({ error: "Gallery item not found." }, { status: 404 });
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
    return NextResponse.json({ error: "Missing gallery item id." }, { status: 400 });
  }

  const item = await prisma.galleryItem.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: "Gallery item not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.galleryItem.delete({ where: { id } }),
  ]);

  if (item.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(item.cloudinaryPublicId, {
        resource_type: "image",
      });
    } catch (error) {
      console.warn("Failed to delete Cloudinary asset", error);
    }
  }

  return NextResponse.json({ success: true });
}
