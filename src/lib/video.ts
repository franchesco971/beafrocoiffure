export type VideoEmbed = { kind: "file" | "iframe"; src: string };

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const VIDEO_FILE = /\.(mp4|webm)$/i;
const YOUTUBE_ID = /^[\w-]{11}$/;

/** Convertit un lien saisi en admin en source intégrable ; null si le format n'est pas pris en charge. */
export function getVideoEmbed(rawUrl: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : (url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]);
    return id && YOUTUBE_ID.test(id) ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  if (url.hostname === "vimeo.com" || url.hostname === "www.vimeo.com") {
    const id = url.pathname.match(/^\/(\d+)$/)?.[1];
    return id ? { kind: "iframe", src: `https://player.vimeo.com/video/${id}` } : null;
  }

  return VIDEO_FILE.test(url.pathname) ? { kind: "file", src: url.toString() } : null;
}
