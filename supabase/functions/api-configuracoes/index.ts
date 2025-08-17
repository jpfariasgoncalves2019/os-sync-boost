// Função serverless para GET e POST/PUT das configurações da empresa do usuário
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Extrair usuário do JWT (Authorization: Bearer ...)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const authHeader = req.headers.get('authorization');
  let usuario_id = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = authHeader.replace('Bearer ', '');
      // Decodificar JWT para pegar o sub (usuário)
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      usuario_id = payload.sub;
    } catch (e) {}
  }
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // if (!usuario_id) {
  //   return new Response(
  //     JSON.stringify({ ok: false, error: { code: 'NO_USER', message: 'Usuário não autenticado' } }),
  //     { status: 401, headers: corsHeaders }
  //   );
  // }

  if (req.method === 'GET') {
    // Buscar dados da empresa
    const { data, error } = await supabase
      .from('configuracoes_usuario')
      .select('nome_fantasia, cnpj, telefone, endereco, logo_empresa')
      .eq('usuario_id', usuario_id)
      .single();
    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error }),
        { status: 500, headers: corsHeaders }
      );
    }
    return new Response(
      JSON.stringify({ ok: true, data }),
      { headers: corsHeaders }
    );
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = await req.json();
    const { nome_fantasia, cnpj, telefone, endereco, logo_empresa } = body;
    if (!nome_fantasia) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_FIELDS', message: 'nome_fantasia é obrigatório' } }),
        { status: 400, headers: corsHeaders }
      );
    }
    const { error } = await supabase
      .from('configuracoes_usuario')
      .upsert({ usuario_id, nome_fantasia, cnpj, telefone, endereco, logo_empresa });
    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error }),
        { status: 500, headers: corsHeaders }
      );
    }
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: corsHeaders }
    );
  }

  return new Response('Método não suportado', { status: 405, headers: corsHeaders });
});
