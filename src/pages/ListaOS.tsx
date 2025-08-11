import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye, FileText, MessageCircle, Edit, Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

import { apiClient } from "@/lib/api";
import { OrdemServico, OSFilters, STATUS_CONFIG, SYNC_STATUS_CONFIG, formatCurrency, formatDate } from "@/lib/types";
import { shareViaWhatsApp } from "@/lib/whatsapp-share";
import { StatusDropdown } from "@/components/StatusDropdown";

export default function ListaOS() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OSFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Garante paginação válida
      const pageNum = Number.isFinite(page) && page > 0 ? page : 1;
      const sizeNum = 20;
      const response = await apiClient.listOS({
        ...filters,
        ...(searchQuery && { query: searchQuery }),
        page: pageNum,
        size: sizeNum,
      });

      if (response.ok && response.data) {
        setOrders(response.data.items);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast({
          title: "Erro ao carregar",
          description: response.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro de conexão",
        description: error?.message || "Não foi possível carregar as OS. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters, searchQuery, page]);

  const handleSearch = (value: string) => {
    // Sanitiza: remove espaços à esquerda e força minúsculo
    const term = value.toLowerCase().trimStart();
    setSearchQuery(term);
    setPage(1);
  };

  const handleFilterChange = (key: keyof OSFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta OS?")) return;

    try {
      const response = await apiClient.deleteOS(id);
      if (response.ok) {
        toast({
          title: "OS excluída",
          description: "A OS foi excluída com sucesso.",
        });
        loadOrders();
      } else {
        toast({
          title: "Erro ao excluir",
          description: response.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a OS.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = (order: OrdemServico) => {
    // Navigate to new OS with pre-filled data
    navigate("/nova-os", { state: { duplicateFrom: order } });
  };

  const handleGeneratePDF = async (order: OrdemServico) => {
    try {
      // Buscar dados da empresa se necessário (pode ser adaptado se já houver contexto)
      let empresaConfig = null;
      if (apiClient.getEmpresaConfig) {
        const userToken = localStorage.getItem("userToken");
        if (userToken) {
          const response = await apiClient.getEmpresaConfig(userToken);
          if (response.ok && response.data) {
            empresaConfig = {
              nome_fantasia: response.data.nome_fantasia || "",
              cnpj: response.data.cnpj || "",
              telefone: response.data.telefone || "",
              endereco: response.data.endereco || "",
              logo_empresa: response.data.logo_empresa || null,
            };
          }
        }
      }
      const { generateOSPDF } = await import("@/lib/pdf-generator");
      const pdfBlob = await generateOSPDF(order, empresaConfig || undefined);
      const fileName = `OS-${order.os_numero_humano}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "PDF Gerado",
        description: "PDF salvo. Você pode compartilhar quando quiser.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsApp = (order: OrdemServico) => {
    if (!order.clientes?.telefone) {
      toast({
        title: "Telefone não encontrado",
        description: "Cliente não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    const message = `Olá ${order.clientes.nome}! Sua OS ${order.os_numero_humano} foi atualizada. Status: ${STATUS_CONFIG[order.status].label}.`;
    const whatsappUrl = `https://wa.me/${order.clientes.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    try {
      window.open(whatsappUrl, "_blank");
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o WhatsApp.",
        variant: "destructive",
      });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button asChild>
          <Link to="/nova-os">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, número da OS, serviço ou produto..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* OS Cards */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma OS encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filters.status 
                ? "Tente ajustar os filtros de busca."
                : "Comece criando sua primeira Ordem de Serviço."}
            </p>
            <Button asChild>
              <Link to="/nova-os">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira OS
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.os_numero_humano}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <div><strong>Nome:</strong> {order.clientes?.nome || "Cliente não encontrado"}</div>
                      <div><strong>Telefone:</strong> {order.clientes?.telefone || "Não informado"}</div>
                      <div><strong>Equipamento:</strong> {
                        order.equipamento_os?.tipos_equipamentos?.nome
                        || order.equipamento_os?.tipo_nome
                        || order.equipamento?.tipo_nome
                        || (Array.isArray(order.equipamento_os) ? order.equipamento_os[0]?.tipos_equipamentos?.nome : undefined)
                        || "Não informado"
                      }</div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/os/${order.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGeneratePDF(order)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendWhatsApp(order)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Enviar WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/editar-os/${order.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(order)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(order.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data de Entrada:</span>
                  <span>{formatDate(order.data)}</span>
                </div>
                <div className="flex justify-between items-end mt-2 gap-2 flex-wrap">
                  <span className="font-semibold text-lg">{formatCurrency(order.total_geral)}</span>
                  <div className="w-32 min-w-[120px]">
                    <StatusDropdown 
                      osId={order.id}
                      currentStatus={order.status}
                      onStatusChange={(newStatus) => {
                        setOrders(prev => 
                          prev.map(o => o.id === order.id ? { ...o, status: newStatus as any } : o)
                        );
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}