import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
            return new Response(
              JSON.stringify({
                ok: false,
                error: { code: "NOT_FOUND", message: "OS não encontrada" }
              }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // List OS with filters
          const status = url.searchParams.get('status');
          const dateFrom = url.searchParams.get('date_from');
          const dateTo = url.searchParams.get('date_to');
          const query = url.searchParams.get('query');
          const page = parseInt(url.searchParams.get('page') || '1');
          const size = parseInt(url.searchParams.get('size') || '20');

          let queryBuilder = supabase
            .from('ordens_servico')
            .select(`
              *,
              clientes(nome, telefone),
              servicos_os(nome_servico),
              produtos_os(nome_produto)
            `, { count: 'exact' })
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

          if (status) {
            queryBuilder = queryBuilder.eq('status', status);
          }

          if (dateFrom) {
            queryBuilder = queryBuilder.gte('data', dateFrom);
          }

          if (dateTo) {
            queryBuilder = queryBuilder.lte('data', dateTo);
          }

          if (query) {
            queryBuilder = queryBuilder.or(
              `os_numero_humano.ilike.%${query}%,clientes.nome.ilike.%${query}%,servicos_os.nome_servico.ilike.%${query}%,produtos_os.nome_produto.ilike.%${query}%`
            );
          }

          const { data, error, count } = await queryBuilder
            .range((page - 1) * size, page * size - 1);

          if (error) throw error;

          return new Response(
            JSON.stringify({
              ok: true,
              data: {
                items: data,
                pagination: {
                  page,
                  size,
                  total: count,
                  pages: Math.ceil((count || 0) / size)
                }
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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