import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple encryption (in production, use proper encryption)
function encryptKey(key: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  return btoa(String.fromCharCode(...data));
}

function decryptKey(encryptedKey: string): string {
  const data = atob(encryptedKey);
  return data;
}

// Test OpenAI API key
async function testOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing OpenAI key:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    if (req.method === 'POST') {
      if (url.pathname.endsWith('/test')) {
        // Test existing key
        const { usuario_id } = await req.json();
        
        if (!usuario_id) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: { code: "MISSING_USER_ID", message: "usuário_id é obrigatório" }
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Get stored key
        const { data: keyData } = await supabase
          .from('user_openai_keys')
          .select('encrypted_key')
          .eq('usuario_id', usuario_id)
          .single();

        if (!keyData?.encrypted_key) {
          return new Response(
            JSON.stringify({
              ok: true,
              data: { openai_key_ok: false }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const decryptedKey = decryptKey(keyData.encrypted_key);
        const isValid = await testOpenAIKey(decryptedKey);

        // Update status in configuracoes_usuario
        await supabase
          .from('configuracoes_usuario')
          .upsert({
            usuario_id,
            openai_key_status: isValid
          });

        return new Response(
          JSON.stringify({
            ok: true,
            data: { openai_key_ok: isValid }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Save new key
        const { usuario_id, openai_api_key } = await req.json();
        
        if (!usuario_id || !openai_api_key) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: { code: "MISSING_FIELDS", message: "usuário_id e openai_api_key são obrigatórios" }
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Basic validation
        if (!openai_api_key.startsWith('sk-')) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: { code: "INVALID_KEY_FORMAT", message: "Formato de chave inválido" }
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Test the key
        const isValid = await testOpenAIKey(openai_api_key);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: { code: "INVALID_KEY", message: "Chave OpenAI inválida" }
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Encrypt and store the key
        const encryptedKey = encryptKey(openai_api_key);
        
        // Create table if not exists (simplified for this example)
        await supabase.rpc('create_user_openai_keys_table');
        
        await supabase
          .from('user_openai_keys')
          .upsert({
            usuario_id,
            encrypted_key: encryptedKey,
            created_at: new Date().toISOString()
          });

        // Update status in configuracoes_usuario
        await supabase
          .from('configuracoes_usuario')
          .upsert({
            usuario_id,
            openai_key_status: true
          });

        return new Response(
          JSON.stringify({
            ok: true,
            data: { saved: true }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
  } catch (error) {
    console.error('Error in OpenAI key API:', error);
    
    if (error.message?.includes('unauthorized')) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: "OPENAI_UNAUTHORIZED", message: "Chave OpenAI não autorizada" }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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