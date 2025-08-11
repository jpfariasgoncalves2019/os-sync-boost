import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { z } from 'https://esm.sh/zod@3.23.8';

const supabaseUrl = Deno.env.get('SB_URL')!;
const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const ch = corsHeaders(origin);
  const corsPreflight = handleCors(req);
  if (corsPreflight) return corsPreflight;

  try {
    const url = new URL(req.url);
    switch (req.method) {
      case 'GET': {
        const params = Object.fromEntries(url.searchParams.entries());
        const schema = z.object({
          q: z.string().max(100).optional(),
          page: z.coerce.number().int().positive().default(1),
          size: z.coerce.number().int().min(1).max(100).default(20),
        });
        const parsed = schema.safeParse(params);
        if (!parsed.success) {
          return new Response(JSON.stringify({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsed.error.issues } }), {
            status: 400, headers: { ...ch, 'Content-Type': 'application/json' }
          });
        }
        const { q, page, size } = parsed.data;
        const from = (page - 1) * size;
        const to = page * size - 1;
        let query = supabase.from('tipos_equipamentos').select('*', { count: 'exact' }).order('nome', { ascending: true });
        if (q) query = query.ilike('nome', `%${q}%`);
        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, data: { items: data || [], pagination: { page, size, total: count, pages: Math.ceil((count || 0) / size) } } }), { headers: { ...ch, 'Content-Type': 'application/json' } });
      }
      case 'POST': {
        const { nome } = await req.json();
        if (!nome || typeof nome !== 'string' || !nome.trim()) {
          return new Response(JSON.stringify({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Nome é obrigatório' } }), { status: 400, headers: { ...ch, 'Content-Type': 'application/json' } });
        }
        // Normaliza nome para evitar duplicidade
        const nomeNorm = nome.trim();
        const { data: exists } = await supabase.from('tipos_equipamentos').select('id').ilike('nome', nomeNorm).maybeSingle();
        if (exists) {
          return new Response(JSON.stringify({ ok: false, error: { code: 'DUPLICATE', message: 'Tipo já existe' } }), { status: 409, headers: { ...ch, 'Content-Type': 'application/json' } });
        }
        const { data, error } = await supabase.from('tipos_equipamentos').insert([{ nome: nomeNorm }]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, data }), { headers: { ...ch, 'Content-Type': 'application/json' } });
      }
      default:
        return new Response(JSON.stringify({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Método não permitido" } }), {
          status: 405, headers: { ...ch, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } }), {
      status: 500, headers: { ...ch, 'Content-Type': 'application/json' }
    });
  }
});
