-- Criação das tabelas para o sistema de OS

-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  importado_da_agenda BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_numero_humano TEXT UNIQUE NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('rascunho', 'aberta', 'em_andamento', 'concluida', 'cancelada')) DEFAULT 'aberta',
  forma_pagamento TEXT NOT NULL,
  garantia TEXT,
  observacoes TEXT,
  total_servicos NUMERIC(12,2) DEFAULT 0.00,
  total_produtos NUMERIC(12,2) DEFAULT 0.00,
  total_despesas NUMERIC(12,2) DEFAULT 0.00,
  total_geral NUMERIC(12,2) DEFAULT 0.00,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'error')) DEFAULT 'pending',
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de equipamentos
CREATE TABLE public.equipamento_os (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) UNIQUE,
  tipo TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de serviços da OS
CREATE TABLE public.servicos_os (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id),
  nome_servico TEXT NOT NULL,
  valor_unitario NUMERIC(12,2) DEFAULT 0.00,
  valor_total NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produtos da OS
CREATE TABLE public.produtos_os (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id),
  nome_produto TEXT NOT NULL,
  quantidade NUMERIC(12,2) DEFAULT 1.00,
  valor_unitario NUMERIC(12,2) DEFAULT 0.00,
  valor_total NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de despesas da OS
CREATE TABLE public.despesas_os (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fotos da OS
CREATE TABLE public.fotos_os (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id),
  caminho_imagem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações do usuário
CREATE TABLE public.configuracoes_usuario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  logo_empresa TEXT,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  endereco TEXT,
  openai_key_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para otimização
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_ordens_servico_cliente_data ON public.ordens_servico(cliente_id, data);
CREATE INDEX idx_ordens_servico_status ON public.ordens_servico(status);
CREATE INDEX idx_ordens_servico_numero ON public.ordens_servico(os_numero_humano);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamento_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso a todos os registros para simplificar o MVP)
CREATE POLICY "Permitir tudo para clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir tudo para ordens_servico" ON public.ordens_servico FOR ALL USING (true);
CREATE POLICY "Permitir tudo para equipamento_os" ON public.equipamento_os FOR ALL USING (true);
CREATE POLICY "Permitir tudo para servicos_os" ON public.servicos_os FOR ALL USING (true);
CREATE POLICY "Permitir tudo para produtos_os" ON public.produtos_os FOR ALL USING (true);
CREATE POLICY "Permitir tudo para despesas_os" ON public.despesas_os FOR ALL USING (true);
CREATE POLICY "Permitir tudo para fotos_os" ON public.fotos_os FOR ALL USING (true);
CREATE POLICY "Permitir tudo para configuracoes_usuario" ON public.configuracoes_usuario FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipamento_os_updated_at
  BEFORE UPDATE ON public.equipamento_os
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_os_updated_at
  BEFORE UPDATE ON public.servicos_os
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_os_updated_at
  BEFORE UPDATE ON public.produtos_os
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despesas_os_updated_at
  BEFORE UPDATE ON public.despesas_os
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fotos_os_updated_at
  BEFORE UPDATE ON public.fotos_os
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_usuario_updated_at
  BEFORE UPDATE ON public.configuracoes_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();