import { generateOSPDF } from "./pdf-generator";

const mockOS = {
  os_numero_humano: "OS-202508-00001",
  clientes: { nome: "João Silva Santos", telefone: "(51) 99999-9999" },
  created_at: new Date().toISOString(),
  data: new Date().toISOString(),
  servicos_os: [
    { 
      nome_servico: "Troca completa de óleo do motor com filtro", 
      valor_unitario: 85, 
      valor_total: 85 
    },
    { 
      nome_servico: "Revisão geral do sistema de freios", 
      valor_unitario: 120, 
      valor_total: 120 
    }
  ],
  produtos_os: [
    { 
      nome_produto: "Óleo sintético 5W30 - 4 litros", 
      quantidade: 1, 
      valor_unitario: 45.90, 
      valor_total: 45.90 
    },
    { 
      nome_produto: "Filtro de óleo original", 
      quantidade: 1, 
      valor_unitario: 28.50, 
      valor_total: 28.50 
    },
    { 
      nome_produto: "Pastilhas de freio dianteiras", 
      quantidade: 1, 
      valor_unitario: 89.90, 
      valor_total: 89.90 
    }
  ],
  despesas_os: [
    { descricao: "Deslocamento para buscar peças", valor: 25.00 },
    { descricao: "Taxa de descarte de óleo usado", valor: 5.00 }
  ],
  total_servicos: 205,
  total_produtos: 164.30,
  total_despesas: 30.00,
  total_geral: 399.30,
  forma_pagamento: "À vista com 5% de desconto",
  garantia: "3 meses para serviços e 6 meses para produtos",
  observacoes: "Cliente solicitou revisão completa. Todas as peças foram substituídas conforme recomendação técnica. Próxima revisão recomendada em 10.000 km."
};

const mockEmpresa = {
  nome_fantasia: "Oficina Teste",
  cnpj: "12345678000199",
  telefone: "51999999999",
  endereco: "Rua Teste, 123"
};

(async () => {
  try {
    const blob = await generateOSPDF(mockOS as any, mockEmpresa);
    if (blob instanceof Blob && blob.size > 0) {
      console.log("[TESTE PDF] PDF gerado com sucesso! Tamanho:", blob.size);
    } else {
      console.error("[TESTE PDF] Falha ao gerar PDF: Blob inválido.");
    }
  } catch (err) {
    console.error("[TESTE PDF] Erro ao gerar PDF:", err);
  }
})();
