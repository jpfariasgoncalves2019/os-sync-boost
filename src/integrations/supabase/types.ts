export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          importado_da_agenda: boolean | null
          nome: string
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          importado_da_agenda?: boolean | null
          nome: string
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          importado_da_agenda?: boolean | null
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_usuario: {
        Row: {
          cnpj: string | null
          created_at: string
          endereco: string | null
          id: string
          logo_empresa: string | null
          nome_fantasia: string
          openai_key_status: boolean | null
          telefone: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_empresa?: string | null
          nome_fantasia: string
          openai_key_status?: boolean | null
          telefone?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_empresa?: string | null
          nome_fantasia?: string
          openai_key_status?: boolean | null
          telefone?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      despesas_os: {
        Row: {
          created_at: string
          descricao: string
          id: string
          ordem_servico_id: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          ordem_servico_id: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          ordem_servico_id?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamento_os: {
        Row: {
          created_at: string
          id: string
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          ordem_servico_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          ordem_servico_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          ordem_servico_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: true
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_os: {
        Row: {
          caminho_imagem: string
          created_at: string
          id: string
          ordem_servico_id: string
          updated_at: string
        }
        Insert: {
          caminho_imagem: string
          created_at?: string
          id?: string
          ordem_servico_id: string
          updated_at?: string
        }
        Update: {
          caminho_imagem?: string
          created_at?: string
          id?: string
          ordem_servico_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_id: string
          created_at: string
          data: string
          deleted_at: string | null
          forma_pagamento: string
          garantia: string | null
          id: string
          observacoes: string | null
          os_numero_humano: string
          status: string | null
          sync_status: string | null
          total_despesas: number | null
          total_geral: number | null
          total_produtos: number | null
          total_servicos: number | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data: string
          deleted_at?: string | null
          forma_pagamento: string
          garantia?: string | null
          id?: string
          observacoes?: string | null
          os_numero_humano: string
          status?: string | null
          sync_status?: string | null
          total_despesas?: number | null
          total_geral?: number | null
          total_produtos?: number | null
          total_servicos?: number | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: string
          deleted_at?: string | null
          forma_pagamento?: string
          garantia?: string | null
          id?: string
          observacoes?: string | null
          os_numero_humano?: string
          status?: string | null
          sync_status?: string | null
          total_despesas?: number | null
          total_geral?: number | null
          total_produtos?: number | null
          total_servicos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_os: {
        Row: {
          created_at: string
          id: string
          nome_produto: string
          ordem_servico_id: string
          quantidade: number | null
          updated_at: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome_produto: string
          ordem_servico_id: string
          quantidade?: number | null
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          nome_produto?: string
          ordem_servico_id?: string
          quantidade?: number | null
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_os: {
        Row: {
          created_at: string
          id: string
          nome_servico: string
          ordem_servico_id: string
          updated_at: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome_servico: string
          ordem_servico_id: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          nome_servico?: string
          ordem_servico_id?: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      user_openai_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_openai_keys_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
