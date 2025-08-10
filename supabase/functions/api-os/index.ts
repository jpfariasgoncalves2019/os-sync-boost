import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, handleCors } from './cors.ts';

// Inicializa cliente do Supabase
const supabaseUrl = Deno.env.get('SB_URL')!;
const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')!;
console.log("[DEBUG] SB_URL:", supabaseUrl || "NÃO DEFINIDA");
console.log("[DEBUG] SERVICE_ROLE:", serviceKey ? "definida" : "NÃO DEFINIDA");
const supabase = createClient(supabaseUrl, serviceKey);

// Gera número único para OS
function generateOSNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomNumber = Math.floor(Math.random() * 99999) + 1;
  const formattedNumber = String(randomNumber).padStart(5, '0');
  return `OS-${year}${month}-${formattedNumber}`;
}

// Valida payload da OS
function validateOS(data: any) {
  const errors = [];
  if (!data.cliente_id) errors.push("Cliente é obrigatório");
  if (!data.data) errors.push("Data é obrigatória");
  if (!data.forma_pagamento) errors.push("Forma de pagamento é obrigatória");

  const hasServices = data.servicos && data.servicos.length > 0;
  const hasProducts = data.produtos && data.produtos.length > 0;
  if (!hasServices && !hasProducts) {
    errors.push("Deve ter pelo menos um serviço ou produto");
  }
  if (data.total_geral < 0) errors.push("Total geral deve ser >= 0");
  return errors;
}

serve(async (req) => {

  // CORS
  const origin = req.headers.get("origin");
  const ch = corsHeaders(origin);
  const corsPreflight = handleCors(req);
  if (corsPreflight) return corsPreflight;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const osId = pathParts[pathParts.length - 1];

    switch (req.method) {
      // Criar OS ou sincronizar alterações
      case 'POST':
        if (url.pathname.endsWith('/sync')) {
          const { changes } = await req.json();
          const applied: string[] = [];
          const conflicts: any[] = [];

          for (const change of changes) {
            const { error } = await supabase.from('ordens_servico').upsert(change).eq('id', change.id);
            if (error) conflicts.push({ id: change.id, error: error.message });
            else applied.push(change.id);
          }

          return new Response(JSON.stringify({ ok: true, data: { applied, conflicts } }), {
            headers: { ...ch, 'Content-Type': 'application/json' }
          });
        } else {
          const data = await req.json();
          const validationErrors = validateOS(data);
          if (validationErrors.length > 0) {
            return new Response(JSON.stringify({
              ok: false,
              error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: validationErrors }
            }), { status: 400, headers: { ...ch, 'Content-Type': 'application/json' } });
          }

          const osNumero = generateOSNumber();
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

          const { data: osData, error: osError } = await supabase.from('ordens_servico').insert([osPayload]).select().single();
          if (osError) throw osError;

          // Relacionamentos
          if (data.equipamento) {
            await supabase.from('equipamento_os').insert([{ ...data.equipamento, ordem_servico_id: osData.id }]);
          }
          if (data.servicos?.length > 0) {
            await supabase.from('servicos_os').insert(data.servicos.map((s: any) => ({ ...s, ordem_servico_id: osData.id })));
          }
          if (data.produtos?.length > 0) {
            await supabase.from('produtos_os').insert(data.produtos.map((p: any) => ({ ...p, ordem_servico_id: osData.id })));
          }
          if (data.despesas?.length > 0) {
            await supabase.from('despesas_os').insert(data.despesas.map((d: any) => ({ ...d, ordem_servico_id: osData.id })));
          }

          return new Response(JSON.stringify({ ok: true, data: osData }), {
            headers: { ...ch, 'Content-Type': 'application/json' }
          });
        }

      // Listar ou buscar OS
      case 'GET':
        if (osId && osId !== 'api-os') {
          const { data, error } = await supabase.from('ordens_servico')
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
            return new Response(JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'OS não encontrada' } }), {
              status: 404, headers: { ...ch, 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify({ ok: true, data }), { headers: { ...ch, 'Content-Type': 'application/json' } });
        } else {
          const params = Object.fromEntries(url.searchParams.entries());
          const schema = z.object({
            query: z.string().max(100).optional().transform(v => (v && v.length ? v : undefined)),
            page: z.coerce.number().int().positive().default(1),
            size: z.coerce.number().int().min(1).max(100).default(20),
            status: z.enum(['rascunho','aberta','em_andamento','concluida','cancelada']).optional(),
            date_from: z.string().optional(),
            date_to: z.string().optional(),
          });

          const parsed = schema.safeParse(params);
          if (!parsed.success) {
            return new Response(JSON.stringify({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsed.error.issues } }), {
              status: 400, headers: { ...ch, 'Content-Type': 'application/json' }
            });
          }

          const { query, page, size, status, date_from, date_to } = parsed.data;
          const from = (page - 1) * size;
          const to = page * size - 1;

          let listQuery = supabase.from('ordens_servico')
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

          if (query) {
            const q = query.replace(/[\n\r\t]/g, ' ').slice(0, 100);
            const [clientIdsRes, osIdsServRes, osIdsProdRes, osIdsNumberRes] = await Promise.all([
              supabase.from('clientes').select('id').ilike('nome', `%${q}%`),
              supabase.from('servicos_os').select('ordem_servico_id').ilike('nome_servico', `%${q}%`),
              supabase.from('produtos_os').select('ordem_servico_id').ilike('nome_produto', `%${q}%`),
              supabase.from('ordens_servico').select('id').ilike('os_numero_humano', `%${q}%`),
            ]);

            const clientIds = (clientIdsRes.data || []).map(r => r.id);
            const osIdsFromServ = (osIdsServRes.data || []).map(r => r.ordem_servico_id);
            const osIdsFromProd = (osIdsProdRes.data || []).map(r => r.ordem_servico_id);
            let unionIds = new Set<string>([...osIdsFromServ, ...osIdsFromProd, ...((osIdsNumberRes.data || []).map(r => r.id))]);

            if (clientIds.length) {
              const osByClients = await supabase.from('ordens_servico').select('id').in('cliente_id', clientIds);
              (osByClients.data || []).forEach(r => unionIds.add(r.id));
            }

            const ids = Array.from(unionIds);
            if (ids.length === 0) {
              return new Response(JSON.stringify({ ok: true, data: { items: [], pagination: { page, size, total: 0, pages: 0 } } }), {
                headers: { ...ch, 'Content-Type': 'application/json' }
              });
            }

            listQuery = listQuery.in('id', ids);
          }

          const { data, error, count } = await listQuery.range(from, to);
          if (error) throw error;

          return new Response(JSON.stringify({
            ok: true,
            data: {
              items: data || [],
              pagination: { page, size, total: count, pages: Math.ceil((count || 0) / size) }
            }
          }), { headers: { ...ch, 'Content-Type': 'application/json' } });
        }

      // Atualizar OS
      case 'PUT':
        if (osId) {
          const data = await req.json();
          const updatePayload: any = { sync_status: 'synced' };
          Object.assign(updatePayload, data);

          const { data: osData, error } = await supabase.from('ordens_servico').update(updatePayload).eq('id', osId).select().single();
          if (error) throw error;

          return new Response(JSON.stringify({ ok: true, data: osData }), {
            headers: { ...ch, 'Content-Type': 'application/json' }
          });
        }
        break;

      // Excluir OS (soft delete)
      case 'DELETE':
        if (osId) {
          const { error } = await supabase.from('ordens_servico').update({ deleted_at: new Date().toISOString() }).eq('id', osId);
          if (error) throw error;

          return new Response(JSON.stringify({ ok: true, data: { deleted: true } }), {
            headers: { ...ch, 'Content-Type': 'application/json' }
          });
        }
        break;

      default:
        return new Response(JSON.stringify({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Método não permitido" } }), {
          status: 405, headers: { ...ch, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: any) {
    console.error('Error in OS API:', error);
    return new Response(JSON.stringify({ ok: false, error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } }), {
  status: 500, headers: { ...ch, 'Content-Type': 'application/json' }
    });
  }
});
