// Derrière Caddy, `x-forwarded-for` contient l'adresse du client.
export const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
