import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { InvalidMediaError, detectVideo, processImage } from "./process";

const mp4 = (brand: string) =>
  Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from(`ftyp${brand}`), Buffer.alloc(16)]);

describe("detectVideo", () => {
  it("reconnaît un MP4 et un WebM d'après leur contenu", () => {
    expect(detectVideo(mp4("isom"))).toBe("mp4");
    expect(detectVideo(mp4("qt  "))).toBe("mp4");
    expect(detectVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]))).toBe("webm");
  });

  it("refuse les autres fichiers, dont les images HEIC (même en-tête ftyp)", () => {
    expect(detectVideo(mp4("heic"))).toBeNull();
    expect(detectVideo(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(detectVideo(Buffer.alloc(0))).toBeNull();
  });
});

describe("processImage", () => {
  const png = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: "#d9a441" } })
      .png()
      .toBuffer();

  it("convertit en WebP et réduit à 1600 px au plus", async () => {
    const output = sharp(await processImage(await png(3200, 2000)));
    const { format, width, height } = await output.metadata();

    expect(format).toBe("webp");
    expect(width).toBe(1600);
    expect(height).toBe(1000);
  });

  it("n'agrandit pas une petite image", async () => {
    const { width } = await sharp(await processImage(await png(300, 200))).metadata();
    expect(width).toBe(300);
  });

  it("refuse un fichier qui n'est pas une image JPEG, PNG ou WebP", async () => {
    await expect(processImage(Buffer.from("pas une image"))).rejects.toBeInstanceOf(InvalidMediaError);

    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'></svg>");
    await expect(processImage(svg)).rejects.toBeInstanceOf(InvalidMediaError);
  });
});
