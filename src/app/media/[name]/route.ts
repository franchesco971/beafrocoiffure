import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { openUpload } from "@/lib/storage";

// Les noms sont aléatoires et jamais réutilisés : le contenu d'une URL ne change pas.
const HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "Accept-Ranges": "bytes",
  "X-Content-Type-Options": "nosniff",
};

/** `bytes=début-fin`, `bytes=début-` ou `bytes=-derniers` ; null si la plage est invalide ou hors du fichier. */
function parseRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (match[1] === "" && match[2] === "")) return null;

  const start = match[1] === "" ? Math.max(size - Number(match[2]), 0) : Number(match[1]);
  const end = match[1] === "" || match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  return start <= end && start < size ? { start, end } : null;
}

const body = (stream: Readable) => Readable.toWeb(stream) as unknown as ReadableStream;

// Les vidéos exigent les requêtes `Range` (lecture et déplacement dans la vidéo).
export async function GET(request: NextRequest, ctx: RouteContext<"/media/[name]">) {
  const file = await openUpload((await ctx.params).name);
  if (!file) return new Response(null, { status: 404 });

  const rangeHeader = request.headers.get("range");
  if (rangeHeader === null) {
    return new Response(body(file.stream()), {
      headers: { ...HEADERS, "Content-Type": file.contentType, "Content-Length": String(file.size) },
    });
  }

  const range = parseRange(rangeHeader, file.size);
  if (!range) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });

  return new Response(body(file.stream(range)), {
    status: 206,
    headers: {
      ...HEADERS,
      "Content-Type": file.contentType,
      "Content-Length": String(range.end - range.start + 1),
      "Content-Range": `bytes ${range.start}-${range.end}/${file.size}`,
    },
  });
}
