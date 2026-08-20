import {
  ALLOWED_IMAGE_TYPES,
  PHOTO_MAX_EDGE,
  PHOTO_MAX_ORIGINAL_BYTES,
} from "@/lib/constants";

export class PhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoError";
  }
}

export async function processPhoto(file: File): Promise<{
  blob: Blob;
  previewUrl: string;
}> {
  if (file.size > PHOTO_MAX_ORIGINAL_BYTES) {
    throw new PhotoError("That photo is a bit large. Try one under 8 MB.");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new PhotoError("Try a JPEG, PNG, or WebP photo.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new PhotoError("That photo didn't make it through. Try another one.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new PhotoError("That photo didn't make it through. Try another one."));
      },
      "image/webp",
      0.82,
    );
  });

  return { blob, previewUrl: URL.createObjectURL(blob) };
}
