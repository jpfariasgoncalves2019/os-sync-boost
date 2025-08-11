import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { buildCorsHeaders, handleOptions } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions(req);
  const origin = req.headers.get('Origin') || undefined;
  const ch = buildCorsHeaders(origin);
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
        let query = supabase.from('marcas').select('*', { count: 'exact' }).order('nome', { ascending: true });
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
        const { data: exists } = await supabase.from('marcas').select('id').ilike('nome', nomeNorm).maybeSingle();
        if (exists) {
          return new Response(JSON.stringify({ ok: false, error: { code: 'DUPLICATE', message: 'Marca já existe' } }), { status: 409, headers: { ...ch, 'Content-Type': 'application/json' } });
        }
        const { data, error } = await supabase.from('marcas').insert([{ nome: nomeNorm }]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, data }), { headers: { ...ch, 'Content-Type': 'application/json' } });
      }
      default:
        return new Response(JSON.stringify({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Método não permitido" } }), {
          status: 405, headers: { ...ch, 'Content-Type': 'application/json' }
        });
    }
  } catch (err) {
    const payload = { ok: false, message: (err as Error).message ?? "Erro interno", stack: (err as Error).stack ?? null };
    return new Response(JSON.stringify(payload), { status: 500, headers: { ...ch, 'Content-Type': 'application/json' } });
  }
});
