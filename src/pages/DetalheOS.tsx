// Corrigido: Erro de sintaxe "Unterminated regular expression" resolvido na linha 213.
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { OrdemServico, formatCurrency, formatDateTime, STATUS_CONFIG } from "@/lib/types";
import { generateOSPDF, EmpresaConfig } from "@/lib/pdf-generator";
import { useUserToken } from "@/hooks/use-user-token";
import { shareViaWhatsApp } from "@/lib/whatsapp-share";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusDropdown } from "@/components/StatusDropdown";
import { Calendar, Package, Receipt, ArrowLeft } from "lucide-react";

export default function DetalheOS() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [os, setOS] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(false);
  const token = useUserToken();

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.getOS(id)
        .then(response => {
          if (response.ok && response.data) {
            setOS(response.data as OrdemServico);
          } else {
            setOS(null);
            toast({
              title: "OS não encontrada",
              description: response.error?.message || "Não foi possível carregar os dados da OS",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error('Erro ao carregar OS:', error);
          setOS(null);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados da OS",
            variant: "destructive"
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">OS não encontrada</h1>
          <Button onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Cálculo dos subtotais e total geral
  const subtotalServicos = Array.isArray(os.servicos_os) ? os.servicos_os.reduce((acc, s) => acc + (s.valor_total || 0), 0) : 0;
  const subtotalProdutos = Array.isArray(os.produtos_os) ? os.produtos_os.reduce((acc, p) => acc + (p.valor_total || 0), 0) : 0;
  const subtotalDespesas = Array.isArray(os.despesas_os) ? os.despesas_os.reduce((acc, d) => acc + (d.valor || 0), 0) : 0;
  const totalGeral = subtotalServicos + subtotalProdutos + subtotalDespesas;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* DADOS DO CLIENTE E EQUIPAMENTO */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente e Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Cliente</h3>
              <div><b>Nome:</b> {os.clientes?.nome || os.cliente_nome || '-'}</div>
              <div><b>Telefone:</b> {os.clientes?.telefone || os.cliente_telefone || '-'}</div>
              <div><b>Email:</b> {os.clientes?.email || os.cliente_email || '-'}</div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Equipamento</h3>
              <div><b>Tipo:</b> {os.equipamento_os?.tipo || os.equipamento?.tipo || '-'}</div>
              <div><b>Marca:</b> {os.equipamento_os?.marca || os.equipamento?.marca || '-'}</div>
              <div><b>Modelo:</b> {os.equipamento_os?.modelo || os.equipamento?.modelo || '-'}</div>
              <div><b>Nº Série:</b> {os.equipamento_os?.numero_serie || os.equipamento?.numero_serie || '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SERVIÇOS */}
      {os.servicos_os && os.servicos_os.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-center">Qtde</TableHead>
                  <TableHead className="text-right">V. Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.servicos_os.map((servico, index) => (
                  <TableRow key={index}>
                    <TableCell>{servico.nome_servico}</TableCell>
                    <TableCell className="text-center">{servico.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(servico.valor_unitario)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(servico.valor_total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">Subtotal Serviços</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_servicos || subtotalServicos)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PRODUTOS */}
      {os.produtos_os && os.produtos_os.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtde</TableHead>
                  <TableHead className="text-right">V. Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.produtos_os.map((produto, index) => (
                  <TableRow key={index}>
                    <TableCell>{produto.nome_produto}</TableCell>
                    <TableCell className="text-center">{produto.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(produto.valor_unitario ?? produto.preco_unitario)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(produto.valor_total ?? produto.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">Subtotal Produtos</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_produtos || subtotalProdutos)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* DESPESAS */}
      {os.despesas_os && os.despesas_os.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.despesas_os.map((despesa, index) => (
                  <TableRow key={index}>
                    <TableCell>{despesa.descricao}</TableCell>
                    <TableCell className="text-right">{formatCurrency(despesa.valor)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Subtotal Despesas</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_despesas || subtotalDespesas)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Totais e Condições */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(os.total_geral || totalGeral)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Serviços:</span>
                <span>{formatCurrency(os.total_servicos || subtotalServicos)}</span>
              </div>
              <div className="flex justify-between">
                <span>Produtos:</span>
                <span>{formatCurrency(os.total_produtos || subtotalProdutos)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas:</span>
                <span>{formatCurrency(os.total_despesas || subtotalDespesas)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">{STATUS_CONFIG[os.status]?.label || os.status}</p>
            </div>
            {os.forma_pagamento && (
              <div>
                <p className="text-sm font-medium">Forma de Pagamento</p>
                <p className="text-sm text-muted-foreground">{os.forma_pagamento}</p>
              </div>
            )}
            {os.garantia && (
              <div>
                <p className="text-sm font-medium">Garantia</p>
                <p className="text-sm text-muted-foreground">{os.garantia}</p>
              </div>
            )}
            {os.observacoes && (
              <div>
                <p className="text-sm font-medium">Observações</p>
                <p className="text-sm text-muted-foreground">{os.observacoes}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Data de Criação</p>
              <p className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-1" />
                {formatDateTime(os.created_at || os.data)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}