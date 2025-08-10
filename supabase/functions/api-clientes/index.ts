import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';


// Lista de origens permitidas
const allowedOrigins = [
  'https://progestec.netlify.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

// Função para obter o origin do request
function getOrigin(req: Request) {
  return req.headers.get('origin') || '';
}

// Função para montar os headers CORS dinamicamente
function getCorsHeaders(origin: string) {
  const isAllowed = allowedOrigins.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
    'Vary': 'Origin'
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to validate phone number (basic E.164 format)
function validatePhone(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

// Helper function to normalize phone to E.164
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 55 (Brazil), format as +55
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  
  // If doesn't start with country code, assume Brazil
  if (digits.length >= 10) {
    return `+55${digits}`;
  }
  
  return `+55${digits}`;
}

// Helper function to validate client data
function validateClient(data: any) {
  const errors = [];
  
  if (!data.nome?.trim()) errors.push("Nome é obrigatório");
  if (!data.telefone?.trim()) errors.push("Telefone é obrigatório");
  
  if (data.telefone) {
    const normalizedPhone = normalizePhone(data.telefone);
    if (!validatePhone(normalizedPhone)) {
      errors.push("Informe um telefone válido com DDD.");
    }
  }
  
  return errors;
}


serve(async (req) => {
  const origin = getOrigin(req);
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const clienteId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'POST': {
        const data = await req.json();
        const validationErrors = validateClient(data);

        if (validationErrors.length > 0) {
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

        // Normalize phone
        const normalizedPhone = normalizePhone(data.telefone);

        // Check for duplicates by phone + name
        const { data: existingClients } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefone', normalizedPhone)
          .eq('nome', data.nome.trim());

        if (existingClients && existingClients.length > 0) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: {
                code: "DUPLICATE_CLIENT",
                message: "Cliente já existe com este telefone e nome"
              }
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const { data: clientData, error } = await supabase
          .from('clientes')
          .insert([{
            ...data,
            nome: data.nome.trim(),
            telefone: normalizedPhone,
            email: data.email?.trim() || null
          }])
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ ok: true, data: clientData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'GET': {
        if (clienteId && clienteId !== 'api-clientes') {
          // Get single client
          const { data: client, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .single();

          if (error) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: { code: "NOT_FOUND", message: "Cliente não encontrado" }
              }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data: client }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // List clients with search
          const query = url.searchParams.get('query');
          const page = parseInt(url.searchParams.get('page') || '1');
          const size = parseInt(url.searchParams.get('size') || '20');

          let queryBuilder = supabase
            .from('clientes')
            .select('*', { count: 'exact' })
            .order('nome');

          if (query) {
            queryBuilder = queryBuilder.or(
              `nome.ilike.%${query}%,telefone.ilike.%${query}%,email.ilike.%${query}%`
            );
          }

          const { data: clients, error, count } = await queryBuilder
            .range((page - 1) * size, page * size - 1);

          if (error) throw error;

          return new Response(
            JSON.stringify({
              ok: true,
              data: {
                items: clients,
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
      }

      case 'PUT': {
        if (clienteId) {
          const data = await req.json();
          const validationErrors = validateClient(data);

          if (validationErrors.length > 0) {
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

          const normalizedPhone = normalizePhone(data.telefone);

          const { data: clientData, error } = await supabase
            .from('clientes')
            .update({
              ...data,
              nome: data.nome.trim(),
              telefone: normalizedPhone,
              email: data.email?.trim() || null
            })
            .eq('id', clienteId)
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({ ok: true, data: clientData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'DELETE': {
        if (clienteId) {
          const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', clienteId);

          if (error) throw error;

          return new Response(
            JSON.stringify({ ok: true, data: { deleted: true } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

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
    console.error('Error in Clientes API:', error);
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