export type UploadOptions = {
  folder: string;
  resourceType: "image" | "video" | "raw";
};

export type UploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
};

export async function uploadAsset(file: File, options: UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", options.folder);
  formData.append("resourceType", options.resourceType);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Upload failed");
  }

  const { data } = (await response.json()) as {
    data: {
      secure_url: string;
      public_id: string;
      resource_type: string;
    };
  };

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
  };
}
