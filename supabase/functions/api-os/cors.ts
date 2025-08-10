// supabase/functions/api-os/cors.ts

const STATIC_ORIGINS = new Set<string>([
  "https://progestao.netlify.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

// https://deploy-preview-123--progestao.netlify.app
// https://main--progestao.netlify.app (branch deploy)
const NETLIFY_RE = /^https:\/\/(deploy-preview-\d+--|[a-z0-9-]+--)progestao\.netlify\.app$/i;

// Qualquer localhost/127.0.0.1 com porta
const LOCAL_RE = /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/i;

export function corsHeaders(origin: string | null) {
  const allow =
    origin &&
    (STATIC_ORIGINS.has(origin) || NETLIFY_RE.test(origin) || LOCAL_RE.test(origin))
      ? origin
      : "https://progestao.netlify.app";

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
    "Vary": "Origin",
  };
}

export function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("origin")),
    });
  }
  return null;
}
