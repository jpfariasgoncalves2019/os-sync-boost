// Database types
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  importado_da_agenda: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrdemServico {
  id: string;
  os_numero_humano: string;
  cliente_id: string;
  data: string;
  data_criacao?: string;
  status: 'rascunho' | 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  forma_pagamento: string;
  garantia?: string;
  observacoes?: string;
  total_servicos: number;
  total_produtos: number;
  total_despesas: number;
  total_geral: number;
  sync_status: 'pending' | 'synced' | 'error';
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  
  // Extended display fields
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  equipamento?: EquipamentoOS;
  servicos?: ServicoOS[];
  produtos?: ProdutoOS[];
  despesas?: DespesaOS[];
  
  // Relations
  clientes?: Cliente;
  equipamento_os?: EquipamentoOS;
  servicos_os?: ServicoOS[];
  produtos_os?: ProdutoOS[];
  despesas_os?: DespesaOS[];
  fotos_os?: FotoOS[];
}

export interface EquipamentoOS {
  id: string;
  ordem_servico_id: string;
  tipo_id: number;
  tipo_nome?: string; // para exibição
  marca_id?: number;
  marca_nome?: string; // para exibição
  modelo?: string;
  numero_serie?: string;
  created_at: string;
  updated_at: string;
  tipos_equipamentos?: { nome: string };
  marcas?: { nome: string };
}

export interface ServicoOS {
  id: string;
  ordem_servico_id: string;
  nome_servico: string;
  descricao?: string;
  valor_unitario: number;
  valor_total: number;
  quantidade: number;
  created_at: string;
  updated_at: string;
}

export interface ProdutoOS {
  id: string;
  ordem_servico_id: string;
  nome_produto: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  preco_unitario: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface DespesaOS {
  id: string;
  ordem_servico_id: string;
  descricao: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface FotoOS {
  id: string;
  ordem_servico_id: string;
  caminho_imagem: string;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoUsuario {
  id: string;
  usuario_id: string;
  logo_empresa?: string;
  nome_fantasia: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  openai_key_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmpresaConfig {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  // Campos adicionais usados na UI (opcionais)
  nome_fantasia?: string;
  cnpj?: string;
  logo_empresa?: string | null;
  created_at: string;
  updated_at: string;
}

// Form types for wizard
export interface NovaOSForm {
  // Step 1: Cliente
  cliente_id?: string;
  cliente?: Cliente;

  // Step 2: Equipamento
  equipamento: {
    id?: string;
    tipo_id: number;
    tipo_nome?: string;
    marca_id?: number;
    marca_nome?: string;
    modelo?: string;
    numero_serie?: string;
  };

  // Step 3: Serviços
  servicos: Array<{
    id?: string;
    nome_servico: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
  }>;
  
  // Step 4: Produtos
  produtos: Array<{
    id?: string;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
  }>;
  
  // Step 5: Despesas
  despesas: Array<{
    id?: string;
    descricao: string;
    valor: number;
  }>;
  
  // Step 6: Resumo & Pagamento
  data?: string;
  forma_pagamento: string;
  garantia?: string;
  observacoes?: string;
  status?: 'rascunho' | 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  
  // Totais calculados
  total_servicos?: number;
  total_produtos?: number;
  total_despesas?: number;
  total_geral?: number;
}

// API pagination
export interface Pagination {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  items: T[]; // Adicionando a propriedade items
  total: number;
  page: number;
  per_page: number;
}

// Contact import from phone
export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

// Sync types
export interface SyncStatus {
  lastSync?: string;
  pendingChanges: number;
  hasErrors: boolean;
}

// Filter types
export interface OSFilters {
  status?: 'rascunho' | 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  date_from?: string;
  date_to?: string;
  query?: string;
}

export interface ClientFilters {
  query?: string;
}

// Status colors and labels
export const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
} as const;

export const SYNC_STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  synced: { label: 'Sincronizado', color: 'bg-green-100 text-green-800' },
  error: { label: 'Erro', color: 'bg-red-100 text-red-800' },
} as const;

// Currency formatting
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Date formatting
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}