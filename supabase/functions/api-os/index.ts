import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const allowedOrigins = new Set([
  "https://preview--os-sync-boost.lovable.app",
  "https://progestao.netlify.app",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

function cors(origin: string | null) {
  const allow = origin && allowedOrigins.has(origin) ? origin : "https://progestao.netlify.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
    "Vary": "Origin",
  };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = cors(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean); // .../functions/v1/api-os[/id]
    const last = parts[parts.length - 1];
    const id = last !== "api-os" ? last : null;

    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single();
        if (error || !data) {
          console.error("[api-os] Erro ao buscar cliente:", error);
          return new Response(JSON.stringify({ ok:false, error:{ code:"NOT_FOUND", message:"Cliente não encontrado", details: error?.message || error }}), { status:404, headers:{ ...corsHeaders, "Content-Type":"application/json" }});
        }
        return new Response(JSON.stringify({ ok:true, data }), { headers:{ ...corsHeaders, "Content-Type":"application/json" }});
      }

      let page = Number(url.searchParams.get("page") || "1");
      let sizeRaw = Number(url.searchParams.get("size") || "20");
      if (!Number.isFinite(page) || page < 1) page = 1;
      if (!Number.isFinite(sizeRaw) || sizeRaw < 1) sizeRaw = 20;
      const size = Math.min(100, Math.max(1, sizeRaw));
      const q = (url.searchParams.get("query") || "").trim();

      if (isNaN(page) || isNaN(size)) {
        return new Response(JSON.stringify({ ok:false, error:{ code:"INVALID_PARAMS", message:"Parâmetros de paginação inválidos" }}), { status:400, headers:{ ...corsHeaders, "Content-Type":"application/json" }});
      }

      let qb = supabase.from("clientes").select("*", { count:"exact" }).order("nome", { ascending:true });
      if (q) qb = qb.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%,email.ilike.%${q}%`);

      const from = (page - 1) * size;
      const to = from + size - 1;

      console.log("[api-os] GET list", { page, size, q, from, to });

      try {
        const { data: items, error, count } = await qb.range(from, to);
        if (error) {
          console.error("[api-os] Erro ao buscar lista de clientes:", error);
          return new Response(JSON.stringify({ ok:false, error:{ code:"QUERY_ERROR", message:error.message || error }}), { status:400, headers:{ ...corsHeaders, "Content-Type":"application/json" }});
        }
        return new Response(JSON.stringify({
          ok: true,
          data: {
            items: items ?? [],
            pagination: { page, size, total: count || 0, pages: Math.ceil((count || 0)/size) }
          }
        }), { headers:{ ...corsHeaders, "Content-Type":"application/json" }});
      } catch (err) {
        console.error("[api-os] Erro inesperado na busca:", err);
        return new Response(JSON.stringify({ ok:false, error:{ code:"INTERNAL_ERROR", message: err?.message || "Erro interno" }}), { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" }});
      }
    }

    return new Response(JSON.stringify({ ok:false, error:{ code:"METHOD_NOT_ALLOWED", message:"Método não suportado." }}), { status:405, headers:{ ...corsHeaders, "Content-Type":"application/json" }});

  } catch (err) {
    console.error("Error in api-os:", err);
    return new Response(JSON.stringify({ ok:false, error:{ code:"INTERNAL_ERROR", message:"Erro interno do servidor" } }), { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" }});
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, handleCors } from './cors.ts';


// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to generate OS number
function generateOSNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomNumber = Math.floor(Math.random() * 99999) + 1;
  const formattedNumber = String(randomNumber).padStart(5, '0');
  return `OS-${year}${month}-${formattedNumber}`;
}

// Helper function to validate OS data
function validateOS(data: any) {
  const errors = [];
  
  if (!data.cliente_id) errors.push("Cliente é obrigatório");
  if (!data.data) errors.push("Data é obrigatório");
  if (!data.forma_pagamento) errors.push("Forma de pagamento é obrigatória");
  
  // Must have at least one service or product
  const hasServices = data.servicos && data.servicos.length > 0;
  const hasProducts = data.produtos && data.produtos.length > 0;
  if (!hasServices && !hasProducts) {
    errors.push("Deve ter pelo menos um serviço ou produto");
  }
  
  if (data.total_geral < 0) errors.push("Total geral deve ser >= 0");
  
  return errors;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsPreflight = handleCors(req);
  if (corsPreflight) return corsPreflight;


  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const osId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'POST':
        if (url.pathname.endsWith('/sync')) {
          // Handle sync endpoint
          const { usuario_id, changes } = await req.json();
          const applied = [];
          const conflicts = [];
          
          for (const change of changes) {
            try {
              // Simple conflict resolution: last write wins
              await supabase
                .from('ordens_servico')
                .upsert(change)
                .eq('id', change.id);
              applied.push(change.id);
            } catch (error) {
              conflicts.push({ id: change.id, error: error.message });
            }
          }
          
          return new Response(
            JSON.stringify({ ok: true, data: { applied, conflicts } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Create new OS
          const data = await req.json();
          console.log("[api-os] Payload recebido:", JSON.stringify(data, null, 2));
          const validationErrors = validateOS(data);
          if (validationErrors.length > 0) {
            console.log("[api-os] Erros de validação:", validationErrors);
            return new Response(
              JSON.stringify({
                ok: false,
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Dados inválidos",
                  details: validationErrors
                }
              }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          try {
            // Generate OS number
            const osNumero = generateOSNumber();
          // Insert OS
          // Criar payload apenas com campos que existem na tabela ordens_servico
          const osPayload = {
            cliente_id: data.cliente_id,
            forma_pagamento: data.forma_pagamento,
            garantia: data.garantia,
            observacoes: data.observacoes,
            data: data.data,
            status: data.status,
            total_servicos: data.total_servicos,
            total_produtos: data.total_produtos,
            total_despesas: data.total_despesas,
            total_geral: data.total_geral,
            os_numero_humano: osNumero,
            sync_status: 'synced'
          };

          const { data: osData, error: osError } = await supabase
            .from('ordens_servico')
            .insert([osPayload])
            .select()
            .single();

            if (osError) {
              if (osError.code === '23505') { // Unique constraint violation
                return new Response(
                  JSON.stringify({
                    ok: false,
                    error: {
                      code: "DUPLICATE_NUMBER",
                      message: "Número da OS já existe"
                    }
                  }),
                  {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                );
              }
              console.log("[api-os] Erro ao inserir OS:", osError, data);
              throw osError;
            }

            // Insert related data
            if (data.equipamento) {
              await supabase.from('equipamento_os').insert([{
                ...data.equipamento,
                ordem_servico_id: osData.id
              }]);
            }

            if (data.servicos?.length > 0) {
              await supabase.from('servicos_os').insert(
                data.servicos.map((s: any) => ({
                  ...s,
                  ordem_servico_id: osData.id
                }))
              );
            }

            if (data.produtos?.length > 0) {
              await supabase.from('produtos_os').insert(
                data.produtos.map((p: any) => ({
                  ...p,
                  ordem_servico_id: osData.id
                }))
              );
            }

            if (data.despesas?.length > 0) {
              await supabase.from('despesas_os').insert(
                data.despesas.map((d: any) => ({
                  ...d,
                  ordem_servico_id: osData.id
                }))
              );
            }

            return new Response(
              JSON.stringify({ ok: true, data: osData }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (e) {
            console.log("[api-os] Erro inesperado ao salvar OS:", e, data);
            return new Response(
              JSON.stringify({
                ok: false,
                error: {
                  code: "INTERNAL_ERROR",
                  message: e.message,
                  stack: e.stack
                }
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        }

        case 'GET':
          // Structured logging context
          const requestId = req.headers.get('idempotency-key') || crypto.randomUUID();
          const start = Date.now();
          try {
            if (osId && osId !== 'api-os') {
              // Get single OS
              const { data, error } = await supabase
                .from('ordens_servico')
                .select(`
                  *,
                  clientes(*),
                  equipamento_os(*),
                  servicos_os(*),
                  produtos_os(*),
                  despesas_os(*),
                  fotos_os(*)
                `)
                .eq('id', osId)
                .is('deleted_at', null)
                .single();
  
              if (error) {
                console.error('[api-os][GET one] error', { requestId, osId, error });
                return new Response(
                  JSON.stringify({
                    ok: false,
                    error: { code: 'NOT_FOUND', message: 'OS não encontrada' },
                  }),
                  { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
  
              console.log('[api-os][GET one] success', { requestId, osId, ms: Date.now() - start });
              return new Response(
                JSON.stringify({ ok: true, data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              // List OS with robust filters and pagination
              const urlParams = Object.fromEntries(new URL(req.url).searchParams.entries());
              const schema = z.object({
                query: z.string().trim().max(100).optional().transform(v => (v && v.length ? v : undefined)),
                page: z.coerce.number().int().positive().default(1),
                size: z.coerce.number().int().min(1).max(100).default(20),
                status: z.enum(['rascunho','aberta','em_andamento','concluida','cancelada']).optional(),
                date_from: z.string().optional(),
                date_to: z.string().optional(),
              });
  
              const parsed = schema.safeParse(urlParams);
              if (!parsed.success) {
                console.warn('[api-os][GET list] validation_error', { requestId, issues: parsed.error.issues });
                return new Response(
                  JSON.stringify({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsed.error.issues } }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
  
              const { query, page, size, status, date_from, date_to } = parsed.data;
              const from = (page - 1) * size;
              const to = page * size - 1;
  
              // Base select
              let listQuery = supabase
                .from('ordens_servico')
                .select(`
                  *,
                  clientes(nome, telefone, email),
                  servicos_os(nome_servico),
                  produtos_os(nome_produto)
                `, { count: 'exact' })
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
  
              if (status) listQuery = listQuery.eq('status', status);
              if (date_from) listQuery = listQuery.gte('data', date_from);
              if (date_to) listQuery = listQuery.lte('data', date_to);
  
              // Advanced search across related entities
              if (query) {
                const q = query.replace(/[\n\r\t]/g, ' ').slice(0, 100);
  
                // Run sub-queries in parallel to avoid complex or() across relations
                const [clientIdsRes, osIdsServRes, osIdsProdRes, osIdsNumberRes] = await Promise.all([
                  supabase.from('clientes').select('id').ilike('nome', `%${q}%`),
                  supabase.from('servicos_os').select('ordem_servico_id').ilike('nome_servico', `%${q}%`),
                  supabase.from('produtos_os').select('ordem_servico_id').ilike('nome_produto', `%${q}%`),
                  supabase.from('ordens_servico').select('id').ilike('os_numero_humano', `%${q}%`),
                ]);
  
                const clientIds = (clientIdsRes.data || []).map((r: any) => r.id);
                const osIdsFromServ = (osIdsServRes.data || []).map((r: any) => r.ordem_servico_id);
                const osIdsFromProd = (osIdsProdRes.data || []).map((r: any) => r.ordem_servico_id);
  
                let unionIds = new Set<string>([...osIdsFromServ, ...osIdsFromProd, ...((osIdsNumberRes.data || []).map((r: any) => r.id))]);
  
                if (clientIds.length) {
                  const osByClients = await supabase.from('ordens_servico').select('id').in('cliente_id', clientIds);
                  (osByClients.data || []).forEach((r: any) => unionIds.add(r.id));
                }
  
                const ids = Array.from(unionIds);
                console.log('[api-os][GET list] search ids', { requestId, q, counts: { clientIds: clientIds.length, osIdsFromServ: osIdsFromServ.length, osIdsFromProd: osIdsFromProd.length, ids: ids.length } });
  
                if (ids.length === 0) {
                  console.log('[api-os][GET list] no matches', { requestId, q });
                  return new Response(
                    JSON.stringify({ ok: true, data: { items: [], pagination: { page, size, total: 0, pages: 0 } } }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  );
                }
  
                listQuery = supabase
                  .from('ordens_servico')
                  .select(`
                    *,
                    clientes(nome, telefone, email),
                    servicos_os(nome_servico),
                    produtos_os(nome_produto)
                  `, { count: 'exact' })
                  .in('id', ids)
                  .is('deleted_at', null)
                  .order('created_at', { ascending: false });
              }
  
              const { data, error, count } = await listQuery.range(from, to);
  
              if (error) {
                console.error('[api-os][GET list] error', { requestId, error });
                return new Response(
                  JSON.stringify({ ok: false, error: { code: 'QUERY_ERROR', message: error.message } }),
                  { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
  
              const duration = Date.now() - start;
              console.log('[api-os][GET list] success', { requestId, page, size, total: count, ms: duration });
              return new Response(
                JSON.stringify({
                  ok: true,
                  data: {
                    items: data || [],
                    pagination: {
                      page,
                      size,
                      total: count,
                      pages: Math.ceil((count || 0) / size),
                    },
                  },
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (err: any) {
            console.error('[api-os][GET] unhandled_error', { requestId, message: err?.message, stack: err?.stack });
            return new Response(
              JSON.stringify({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }


      case 'PUT':
        if (osId) {
          const data = await req.json();
          console.log("[api-os] PUT payload recebido:", JSON.stringify(data, null, 2));
          
          // Para atualizações parciais (como apenas status), não validar campos obrigatórios
          // Criar payload apenas com campos enviados que existem na tabela
          const updatePayload: any = {};
          
          // Mapear apenas os campos enviados
          if (data.cliente_id !== undefined) updatePayload.cliente_id = data.cliente_id;
          if (data.forma_pagamento !== undefined) updatePayload.forma_pagamento = data.forma_pagamento;
          if (data.garantia !== undefined) updatePayload.garantia = data.garantia;
          if (data.observacoes !== undefined) updatePayload.observacoes = data.observacoes;
          if (data.data !== undefined) updatePayload.data = data.data;
          if (data.status !== undefined) updatePayload.status = data.status;
          if (data.total_servicos !== undefined) updatePayload.total_servicos = data.total_servicos;
          if (data.total_produtos !== undefined) updatePayload.total_produtos = data.total_produtos;
          if (data.total_despesas !== undefined) updatePayload.total_despesas = data.total_despesas;
          if (data.total_geral !== undefined) updatePayload.total_geral = data.total_geral;
          
          // Sempre atualizar o sync_status
          updatePayload.sync_status = 'synced';

          console.log("[api-os] Update payload:", JSON.stringify(updatePayload, null, 2));

          const { data: osData, error } = await supabase
            .from('ordens_servico')
            .update(updatePayload)
            .eq('id', osId)
            .select()
            .single();

          if (error) {
            console.log("[api-os] Erro ao atualizar OS:", error);
            throw error;
          }

          console.log("[api-os] OS atualizada com sucesso:", osData);

          return new Response(
            JSON.stringify({ ok: true, data: osData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'DELETE':
        if (osId) {
          const { error } = await supabase
            .from('ordens_servico')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', osId);

          if (error) throw error;

          return new Response(
            JSON.stringify({ ok: true, data: { deleted: true } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      default:
        return new Response(
          JSON.stringify({
            ok: false,
            error: { code: "METHOD_NOT_ALLOWED", message: "Método não permitido" }
          }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in OS API:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro interno do servidor"
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});