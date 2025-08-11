-- Criação da tabela de Marcas
CREATE TABLE IF NOT EXISTS marcas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Tipos de Equipamentos
CREATE TABLE IF NOT EXISTS tipos_equipamentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajuste na tabela de Equipamentos
ALTER TABLE equipamentos
  DROP COLUMN IF EXISTS tipo,
  DROP COLUMN IF EXISTS marca,
  ADD COLUMN IF NOT EXISTS tipo_id INTEGER REFERENCES tipos_equipamentos(id),
  ADD COLUMN IF NOT EXISTS marca_id INTEGER REFERENCES marcas(id);
