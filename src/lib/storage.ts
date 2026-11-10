import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Fichiers téléversés : dossier local (volume Docker). Le stockage objet S3 remplacera ce module en production.
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "uploads");

export const MEDIA_URL_PREFIX = "/media/";

export const CONTENT_TYPES = { webp: "image/webp", mp4: "video/mp4", webm: "video/webm" } as const;
export type UploadExtension = keyof typeof CONTENT_TYPES;

// Seuls les noms générés par `saveUpload` sont acceptés : aucun chemin fourni par l'utilisateur n'atteint le disque.
const NAME = /^[a-f0-9]{32}\.(webp|mp4|webm)$/;

const uploadPath = (name: string) => (NAME.test(name) ? path.join(UPLOAD_DIR, name) : null);

/** Enregistre le fichier et renvoie son URL publique (`/media/<nom>`). */
export async function saveUpload(data: Buffer, extension: UploadExtension) {
  const name = `${randomBytes(16).toString("hex")}.${extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), data, { flag: "wx" });
  return `${MEDIA_URL_PREFIX}${name}`;
}

export async function deleteUpload(url: string | null) {
  if (!url?.startsWith(MEDIA_URL_PREFIX)) return;
  const file = uploadPath(url.slice(MEDIA_URL_PREFIX.length));
  if (!file) return;
  await unlink(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

/** Taille, type et flux (octets `start` à `end` inclus si `range`) d'un fichier téléversé ; null s'il n'existe pas. */
export async function openUpload(name: string) {
  const file = uploadPath(name);
  if (!file) return null;
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return null;

  return {
    size: info.size,
    contentType: CONTENT_TYPES[path.extname(name).slice(1) as UploadExtension],
    stream: (range?: { start: number; end: number }) => createReadStream(file, range),
  };
}
