// supabase/functions/_shared/cors.ts
export const allowedOrigins = new Set<string>([
  "https://progestao.netlify.app",
  "http://localhost:8080",
  "https://preview--os-sync-boost.lovable.app", // opcional
]);

export function buildCorsHeaders(origin?: string) {
  const o = origin && allowedOrigins.has(origin) ? origin : "https://progestao.netlify.app";
  return {
    "Access-Control-Allow-Origin": o,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export function handleOptions(req: Request) {
  const headers = buildCorsHeaders(req.headers.get("Origin") || undefined);
  return new Response(null, { status: 204, headers });
}
