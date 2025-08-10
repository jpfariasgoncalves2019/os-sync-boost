import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { OrdemServico, formatCurrency, formatDate } from "./types";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


export interface EmpresaConfig {
  nome_fantasia: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  logo_empresa?: string | null;
}


export async function generateOSPDF(
  os: OrdemServico,
  empresa?: EmpresaConfig
): Promise<Blob> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Margens e dimensões
    const margin = 20;
    const pageWidth = 210; // A4 width
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;
    const gray = [128, 128, 128];
    const lightGray = [240, 240, 240];
    const tableHeaderGray: [number, number, number] = [230, 230, 230];

    // Set font
    doc.setFont("helvetica");

    // Header - Company Info (lado esquerdo)
    // LOG: Dados recebidos
    if (typeof window !== "undefined" && window.console) {
      console.log("[PDF] Dados da OS:", os);
      console.log("[PDF] Dados da Empresa:", empresa);
    }
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(empresa?.nome_fantasia || "Oficina do Luis", margin, currentY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  currentY += 5;
  doc.text(empresa?.cnpj || "37771984000114", margin, currentY);
  currentY += 4;
  doc.text(empresa?.endereco || "Estrada do Quilombo número 1000  - Feitoria", margin, currentY);
  currentY += 4;
  doc.text("93054-600 - São Leopoldo/RS", margin, currentY);

  // Info de contato no lado direito
  const rightMargin = pageWidth - margin;
  doc.setFontSize(9);
  doc.text(`Tel.: ${empresa?.telefone || "51 982279141"}`, rightMargin, margin, { align: "right" });
  doc.text("oficinadoluis.sl@gmail.com", rightMargin, margin + 4, { align: "right" });
  doc.text("Contato: Luis Felipe", rightMargin, margin + 8, { align: "right" });


  // Dados do Cliente
  currentY += 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Dados do Cliente", margin, currentY);
  doc.setTextColor(0, 0, 0);

  currentY += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Nome
  doc.text(os.clientes?.nome || "Cliente não informado", margin, currentY);
  // Data no lado direito
  doc.text(`Data: ${formatDate(os.created_at || os.data)}`, rightMargin, currentY, { align: "right" });

  // Telefone
  currentY += 7;
  doc.text(`Telefone: ${os.clientes?.telefone || "Não informado"}`, margin, currentY);




  // Equipamento
  currentY += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Equipamento", margin, currentY);
  doc.setTextColor(0, 0, 0);

  currentY += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Tabela horizontal para os campos do equipamento
  const eqHeaders = ["Tipo:", "Marca:", "Modelo:", "Nº Série:"];
  const eqValues = [
    os.equipamento_os?.tipo || "Não informado",
    os.equipamento_os?.marca || "Não informado",
    os.equipamento_os?.modelo || "Não informado",
    os.equipamento_os?.numero_serie || "Não informado"
  ];
  const colWidths = [40, 40, 45, 55]; // largura de cada coluna
  let x = margin;

  // Rótulos em negrito
  doc.setFont("helvetica", "bold");
  for (let i = 0; i < eqHeaders.length; i++) {
    doc.text(eqHeaders[i], x, currentY);
    x += colWidths[i];
  }

  // Valores
  x = margin;
  currentY += 6;
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < eqValues.length; i++) {
    doc.text(eqValues[i], x, currentY);
    x += colWidths[i];
  }

  // OS Number - centralizado e destacado
  currentY += 12;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  // Fundo cinza para o número da OS
  doc.setFillColor(gray[0], gray[1], gray[2]);
  doc.rect(margin, currentY - 5, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`ORÇAMENTO Nº ${os.os_numero_humano}`, pageWidth / 2, currentY + 2, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Seções de Serviços e Produtos
  currentY += 13;
  // Serviços
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Serviços", margin, currentY);
  doc.setTextColor(0, 0, 0);
  const servicosData = (os.servicos_os && os.servicos_os.length > 0)
    ? os.servicos_os.map((servico) => [
        `${servico.nome_servico}${servico.descricao ? ' - ' + servico.descricao : ''}`,
        servico.quantidade || 1,
        "un",
        formatCurrency(servico.valor_unitario || servico.valor_total),
        formatCurrency(servico.valor_total),
      ])
    : [["Nenhum serviço cadastrado", "-", "-", "-", "-"]];
  
  currentY += 5;
  // Configuração de autoTable para serviços
  autoTable(doc, {
    startY: currentY,
    head: [["Descrição", "Qtde", "Un", "Valor Unitário", "Valor Total"]],
    body: servicosData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: tableHeaderGray, textColor: 80, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.45, halign: "left" },
      1: { cellWidth: contentWidth * 0.12, halign: "center" },
      2: { cellWidth: contentWidth * 0.08, halign: "center" },
      3: { cellWidth: contentWidth * 0.175, halign: "right" },
      4: { cellWidth: contentWidth * 0.175, halign: "right" },
    },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 1.5, lineColor: [220,220,220], lineWidth: 0.1 },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 3;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Serviços`, pageWidth - margin - 65, currentY, { align: "right" });
  doc.text(formatCurrency(os.total_servicos || 0), pageWidth - margin, currentY, { align: "right" });
  currentY += 10;

  // Produtos
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Produtos", margin, currentY);
  doc.setTextColor(0, 0, 0);
  
  const produtosData = (os.produtos_os && os.produtos_os.length > 0)
    ? os.produtos_os.map((produto) => [
        produto.nome_produto,
        produto.quantidade.toString(),
        "un",
        formatCurrency(produto.valor_unitario),
        formatCurrency(produto.valor_total),
      ])
    : [["Nenhum produto cadastrado", "-", "-", "-", "-"]];
  
  currentY += 5;
  autoTable(doc, {
    startY: currentY,
    head: [["Descrição", "Qtde", "Un", "Valor Unitário", "Valor Total"]],
    body: produtosData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: tableHeaderGray, textColor: 80, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.45, halign: "left" },
      1: { cellWidth: contentWidth * 0.12, halign: "center" },
      2: { cellWidth: contentWidth * 0.08, halign: "center" },
      3: { cellWidth: contentWidth * 0.175, halign: "right" },
      4: { cellWidth: contentWidth * 0.175, halign: "right" },
    },
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 2, 
      lineColor: [200, 200, 200], 
      lineWidth: 0.1,
      overflow: 'linebreak',
      valign: 'middle'
    },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 3;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Produtos`, pageWidth - margin - 65, currentY, { align: "right" });
  doc.text(formatCurrency(os.total_produtos || 0), pageWidth - margin, currentY, { align: "right" });
  currentY += 10;

  // Despesas
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Despesas", margin, currentY);
  doc.setTextColor(0, 0, 0);
  
  const despesasData = (os.despesas_os && os.despesas_os.length > 0)
    ? os.despesas_os.map((despesa) => [
        despesa.descricao,
        formatCurrency(despesa.valor),
      ])
    : [["Nenhuma despesa cadastrada", "-"]];
  
  currentY += 5;
  autoTable(doc, {
    startY: currentY,
    head: [["Descrição", "Valor"]],
    body: despesasData,
    margin: { left: margin, right: margin },
    headStyles: { 
      fillColor: tableHeaderGray, 
      textColor: 80, 
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.7, halign: "left" },
      1: { cellWidth: contentWidth * 0.3, halign: "right" },
    },
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 2, 
      lineColor: [200, 200, 200], 
      lineWidth: 0.1,
      overflow: 'linebreak',
      valign: 'middle'
    },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 3;
  if (os.despesas_os && os.despesas_os.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Despesas`, pageWidth - margin - 65, currentY, { align: "right" });
    doc.text(formatCurrency(os.total_despesas || 0), pageWidth - margin, currentY, { align: "right" });
    currentY += 10;
  } else {
    currentY += 5;
  }

  // Totais - layout conforme imagem
  currentY += 12;
  // Subtotal e Total no lado direito
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", pageWidth - margin - 60, currentY, { align: "right" });
  doc.text(formatCurrency((os.total_servicos || 0) + (os.total_produtos || 0)), pageWidth - margin, currentY, { align: "right" });
  currentY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Total Orçamento", pageWidth - margin - 60, currentY, { align: "right" });
  doc.text(formatCurrency(os.total_geral || 0), pageWidth - margin, currentY, { align: "right" });
  currentY += 13;

  // Observações
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Observações", margin, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  // Condições de pagamento e garantia em negrito
  if (os.forma_pagamento) {
    doc.setFont("helvetica", "bold");
    doc.text("Condições de Pagamento: ", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`À vista`, margin + 55, currentY);
    currentY += 5;
  }
  if (os.garantia) {
    doc.setFont("helvetica", "bold");
    doc.text("Garantia: ", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(os.garantia, margin + 22, currentY);
    currentY += 5;
  }
  if (os.observacoes) {
    const splitText = doc.splitTextToSize(os.observacoes, contentWidth);
    doc.text(splitText, margin, currentY);
    currentY += splitText.length * 5;
  }

  // Footer - Assinatura
  currentY += 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  // Centralizar nome da empresa e assinante
  doc.text(empresa?.nome_fantasia || "Oficina do Luis", pageWidth / 2, currentY, { align: "center" });
  currentY += 5;
  doc.text("Luis Felipe", pageWidth / 2, currentY, { align: "center" });

    // Verificar se autoTable está disponível
    if (typeof doc.autoTable !== "function") {
      console.error("[PDF] autoTable não está disponível no jsPDF.");
    }

    // Convert to blob
    const pdfBlob = doc.output("blob");
    return pdfBlob;
  } catch (err: any) {
    if (typeof window !== "undefined" && window.console) {
      console.error("[PDF] Erro ao gerar PDF:", err);
    }
    throw new Error("Erro ao gerar PDF: " + (err?.message || err));
  }
}