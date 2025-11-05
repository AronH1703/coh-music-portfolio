import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { Readable } from "stream";
import { requireAdminSession } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

const IMAGE_TRANSFORMATIONS = [{ quality: "auto" }, { fetch_format: "auto" }] as const;

type SupportedResource = "image" | "video" | "raw";

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File upload required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = String(formData.get("folder") ?? "coh-music/uploads");
  const resourceType = normalizeResourceType(formData.get("resourceType"));

  const uploadResult = await new Promise<
    | {
        secure_url: string;
        public_id: string;
        resource_type: string;
        bytes?: number;
        width?: number;
        height?: number;
        duration?: number;
      }
    | null
  >((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        transformation: resourceType === "image" ? IMAGE_TRANSFORMATIONS : undefined,
      },
      (error, result) => {
        if (error || !result) {
          resolve(null);
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          bytes: result.bytes,
          width: result.width ?? undefined,
          height: result.height ?? undefined,
          duration: result.duration ?? undefined,
        });
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });

  if (!uploadResult) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ data: uploadResult });
}

function normalizeResourceType(value: FormDataEntryValue | null): SupportedResource {
  const input = typeof value === "string" ? value.toLowerCase() : undefined;
  switch (input) {
    case "image":
    case "video":
    case "raw":
      return input;
    default:
      return "image";
  }
}
