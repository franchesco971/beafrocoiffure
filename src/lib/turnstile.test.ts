import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const stubSiteverify = (result: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => result });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("verifyTurnstile", () => {
  it("laisse passer sans clé secrète (Turnstile désactivé)", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchMock = stubSiteverify({ success: false });
    expect(await verifyTurnstile({}, "1.2.3.4")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{}, { turnstileToken: "" }, { turnstileToken: 42 }, { turnstileToken: "x".repeat(2049) }, null])(
    "refuse un jeton absent ou invalide : %j",
    async (body) => {
      vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
      const fetchMock = stubSiteverify({ success: true });
      expect(await verifyTurnstile(body, "1.2.3.4")).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("transmet jeton, secret et adresse IP à Cloudflare", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = stubSiteverify({ success: true });

    expect(await verifyTurnstile({ turnstileToken: "jeton" }, "1.2.3.4")).toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      secret: "secret",
      response: "jeton",
      remoteip: "1.2.3.4",
    });
  });

  it("n'envoie pas d'adresse IP inconnue", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = stubSiteverify({ success: true });
    await verifyTurnstile({ turnstileToken: "jeton" }, "inconnue");
    expect([...(fetchMock.mock.calls[0][1].body as URLSearchParams).keys()]).toEqual(["secret", "response"]);
  });

  it("refuse quand Cloudflare rejette le jeton ou est injoignable", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    stubSiteverify({ success: false });
    expect(await verifyTurnstile({ turnstileToken: "jeton" }, "1.2.3.4")).toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau")));
    expect(await verifyTurnstile({ turnstileToken: "jeton" }, "1.2.3.4")).toBe(false);
  });
});
