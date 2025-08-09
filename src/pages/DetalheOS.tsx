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
      apiClient.get(`/os/${id}`)
        .then(response => {
          setOS(response.data as OrdemServico);
        })
        .catch(error => {
          console.error('Erro ao carregar OS:', error);
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
      {/* Produtos */}
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
                    <TableCell className="text-right">{formatCurrency(produto.valor_unitario)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(produto.valor_total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">Subtotal Produtos</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_produtos || 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Despesas */}
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
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_despesas || 0)}</TableCell>
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
              {formatCurrency(os.total_geral || 0)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Serviços:</span>
                <span>{formatCurrency(os.total_servicos || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Produtos:</span>
                <span>{formatCurrency(os.total_produtos || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas:</span>
                <span>{formatCurrency(os.total_despesas || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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