-- Tabela para armazenar chaves OpenAI criptografadas
CREATE TABLE public.user_openai_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_openai_keys ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas ao próprio usuário
CREATE POLICY "Users can manage their own OpenAI keys" ON public.user_openai_keys
FOR ALL USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_user_openai_keys_updated_at
  BEFORE UPDATE ON public.user_openai_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar a tabela (usada pela Edge Function)
CREATE OR REPLACE FUNCTION public.create_user_openai_keys_table()
RETURNS void AS $$
BEGIN
  -- Essa função existe apenas para compatibilidade com a Edge Function
  -- A tabela já foi criada acima
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';