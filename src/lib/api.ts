import { EmpresaConfig, Cliente, NovaOSForm, PaginatedResponse, OrdemServico, OSFilters } from "./types";

const API_BASE_URL = '/api';
const SUPABASE_FUNCTIONS_URL =
  'https://ppxexzbmaepudhkqfozt.supabase.co/functions/v1';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    absoluteUrl = false
  ): Promise<ApiResponse<T>> {
    try {
      const url = absoluteUrl ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': this.generateIdempotencyKey(),
          ...options.headers,
        },
        ...options,
      });
      return await response.json();
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Erro de conexão. Verifique sua internet.',
        },
      };
    }
  }

  // --- Configuração da Empresa ---
  async getEmpresaConfig(token: string): Promise<ApiResponse<EmpresaConfig>> {
    return this.request<EmpresaConfig>(
      `${SUPABASE_FUNCTIONS_URL}/api-configuracoes`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
      true
    );
  }

  async saveEmpresaConfig(data: EmpresaConfig, token: string): Promise<ApiResponse<EmpresaConfig>> {
    return this.request<EmpresaConfig>(
      `${SUPABASE_FUNCTIONS_URL}/api-configuracoes`,
      { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } },
      true
    );
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: T): Promise<ApiResponse<T>> {
    return this.request<T>(
      `${SUPABASE_FUNCTIONS_URL}/${endpoint}`,
      { method: 'POST', body: JSON.stringify(data) },
      true
    );
  }

  async put<T>(endpoint: string, data?: T): Promise<ApiResponse<T>> {
    return this.request<T>(
      `${SUPABASE_FUNCTIONS_URL}/${endpoint}`,
      { method: 'PUT', body: JSON.stringify(data) },
      true
    );
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Métodos específicos para OS
  async listOS(params?: OSFilters & { page?: number; size?: number }): Promise<ApiResponse<{ items: OrdemServico[]; pagination: { page: number; size: number; total: number | null; pages: number; } }>> {
    // Filtrar parâmetros undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = Object.keys(cleanParams).length > 0 ? new URLSearchParams(cleanParams as Record<string, string>).toString() : '';
    
    return this.request<{ items: OrdemServico[]; pagination: { page: number; size: number; total: number | null; pages: number; } }>(
      `${SUPABASE_FUNCTIONS_URL}/api-os${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' },
      true
    );
  }

  async getOS(id: string): Promise<ApiResponse<OrdemServico>> {
    try {
      const response = await this.request<OrdemServico>(
        `${SUPABASE_FUNCTIONS_URL}/api-os/${id}`,
        { method: 'GET' },
        true
      );
      if (!response.ok) {
        console.error(`Erro ao buscar OS com ID ${id}:`, response.error);
      }
      return response;
    } catch (error) {
      console.error(`Erro de conexão ao buscar OS com ID ${id}:`, error);
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Erro de conexão. Verifique sua internet.',
        },
      };
    }
  }

  async createOS(data: any): Promise<ApiResponse<OrdemServico>> {
    return this.request<OrdemServico>(
      `${SUPABASE_FUNCTIONS_URL}/api-os`,
      { method: 'POST', body: JSON.stringify(data) },
      true
    );
  }

  async updateOS(id: string, data: Partial<NovaOSForm>): Promise<ApiResponse<OrdemServico>> {
    return this.request<OrdemServico>(
      `${SUPABASE_FUNCTIONS_URL}/api-os/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      true
    );
  }

  async deleteOS(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(
      `${SUPABASE_FUNCTIONS_URL}/api-os/${id}`,
      { method: 'DELETE' },
      true
    );
  }

  // Métodos específicos para Clientes

  async listClients(filters?: Partial<Cliente>): Promise<ApiResponse<PaginatedResponse<Cliente>>> {
    // Filtrar parâmetros undefined
    const cleanFilters = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = Object.keys(cleanFilters).length > 0 ? new URLSearchParams(cleanFilters as Record<string, string>).toString() : '';
    
    return this.request<PaginatedResponse<Cliente>>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' },
      true
    );
  }

  async createClient(data: Cliente): Promise<ApiResponse<Cliente>> {
    return this.request<Cliente>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes`,
      { method: 'POST', body: JSON.stringify(data) },
      true
    );
  }

  async updateClient(id: string, data: Cliente): Promise<ApiResponse<Cliente>> {
    return this.request<Cliente>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      true
    );
  }

  async deleteClient(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes/${id}`,
      { method: 'DELETE' },
      true
    );
  }

  // Métodos para OpenAI
  async testOpenAIKey(key: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.request<{ valid: boolean }>(
      `${SUPABASE_FUNCTIONS_URL}/api-health/openai-key`,
      { method: 'POST', body: JSON.stringify({ key }) },
      true
    );
  }

  async saveOpenAIKey(key: string): Promise<ApiResponse<null>> {
    return this.request<null>(
      `${SUPABASE_FUNCTIONS_URL}/api-health/openai-key`,
      { method: 'PUT', body: JSON.stringify({ key }) },
      true
    );
  }
}

export const apiClient = new ApiClient();