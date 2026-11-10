import sharp from "sharp";
import type { UploadExtension } from "@/lib/storage";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const IMAGE_FORMATS = new Set(["jpeg", "png", "webp"]);
// Marques ISO BMFF des vidéos MP4 (`qt  ` : fichiers QuickTime des téléphones).
const MP4_BRANDS = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "M4V ", "qt  "]);

export class InvalidMediaError extends Error {}

/** Type réel d'une vidéo d'après ses premiers octets (l'extension et le type MIME déclarés ne sont pas fiables). */
export function detectVideo(data: Buffer): Extract<UploadExtension, "mp4" | "webm"> | null {
  if (data.length > 12 && data.toString("latin1", 4, 8) === "ftyp" && MP4_BRANDS.has(data.toString("latin1", 8, 12))) {
    return "mp4";
  }
  if (data.length > 4 && data.readUInt32BE(0) === 0x1a45dfa3) return "webm";
  return null;
}

/** Redimensionne (1600 px maximum), applique l'orientation, retire les métadonnées EXIF et convertit en WebP. */
export async function processImage(data: Buffer) {
  try {
    const image = sharp(data, { limitInputPixels: 60_000_000 });
    const { format } = await image.metadata();
    if (!format || !IMAGE_FORMATS.has(format)) throw new InvalidMediaError("Format d'image non pris en charge.");

    return await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    throw new InvalidMediaError(
      error instanceof InvalidMediaError ? error.message : "Image illisible : utilisez un fichier JPEG, PNG ou WebP.",
    );
  }
}
