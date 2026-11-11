"use client";

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<void> | undefined;

function loadScript() {
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = undefined;
      reject(new Error("Turnstile indisponible"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/** Jeton du défi anti-robot ; inactif (`enabled` faux, `ready` vrai) si la clé de site n'est pas configurée. */
export function useTurnstile() {
  const [token, setToken] = useState("");
  const [round, setRound] = useState(0);

  return {
    enabled: SITE_KEY !== "",
    ready: SITE_KEY === "" || token !== "",
    token,
    /** À appeler après chaque envoi : un jeton n'est valable qu'une seule fois. */
    renew: () => {
      setToken("");
      setRound((value) => value + 1);
    },
    widgetProps: { onToken: setToken, round },
  };
}

export type TurnstileState = ReturnType<typeof useTurnstile>;

export function Turnstile({ onToken, round }: TurnstileState["widgetProps"]) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widget.current = window.turnstile.render(container.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          language: "fr",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
      onToken("");
    };
  }, [onToken]);

  useEffect(() => {
    if (round > 0 && widget.current) window.turnstile?.reset(widget.current);
  }, [round]);

  return SITE_KEY ? <div ref={container} /> : null;
}
