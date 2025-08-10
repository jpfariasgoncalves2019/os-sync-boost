import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FileText, MessageCircle, Edit, Copy, Trash2 } from 'lucide-react';
import { useOSAPI } from '@/hooks/useOSAPI';
import { OrdemServico, OSFilters, STATUS_CONFIG, SYNC_STATUS_CONFIG, formatCurrency, formatDate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { StatusDropdown } from '@/components/StatusDropdown';
import { shareViaWhatsApp } from '@/lib/whatsapp-share';

export default function OSList() {
  const [filters, setFilters] = useState<OSFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({ ...filters, query: searchQuery || undefined, page, size: 20 }), [filters, searchQuery, page]);
  const { data, isLoading, isError, error, refetch, isFetching } = useOSAPI(params);

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, size: 20, total: 0, pages: 0 };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta OS?')) return;
    try {
      // otimista
      toast({ title: 'Solicitado', description: 'Excluindo OS...' });
      const { apiClient } = await import('@/utils/apiClient');
      const res = await apiClient.deleteOS(id);
      if (res.ok) {
        toast({ title: 'OS excluída', description: 'A OS foi excluída com sucesso.' });
        refetch();
      } else {
        toast({ title: 'Erro ao excluir', description: res.error?.message || 'Erro desconhecido', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir a OS.', variant: 'destructive' });
    }
  };

  const handleDuplicate = (order: OrdemServico) => {
    window.location.assign(`/nova-os`);
    sessionStorage.setItem('duplicateFrom', JSON.stringify(order));
  };

  const handleGeneratePDF = async (order: OrdemServico) => {
    try {
      let empresaConfig = null as any;
      const { apiClient } = await import('@/utils/apiClient');
      const userToken = localStorage.getItem('userToken') || '';
      if (userToken) {
        const response = await apiClient.getEmpresaConfig(userToken);
        if (response.ok && response.data) empresaConfig = response.data as any;
      }
      const { generateOSPDF } = await import('@/lib/pdf-generator');
      const pdfBlob = await generateOSPDF(order, empresaConfig || undefined);
      const fileName = `OS-${order.os_numero_humano}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: 'PDF Gerado', description: 'PDF salvo. Você pode compartilhar quando quiser.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao gerar PDF', variant: 'destructive' });
    }
  };

  const handleSendWhatsApp = (order: OrdemServico) => {
    if (!order.clientes?.telefone) {
      toast({ title: 'Telefone não encontrado', description: 'Cliente não possui telefone cadastrado.', variant: 'destructive' });
      return;
    }
    const message = `Olá ${order.clientes.nome}! Sua OS ${order.os_numero_humano} foi atualizada. Status: ${STATUS_CONFIG[order.status].label}.`;
    const whatsappUrl = `https://wa.me/${order.clientes.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button asChild>
          <Link to="/nova-os">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, número da OS, serviço ou produto..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.status || 'all'} onValueChange={(value) => { setFilters((p) => ({ ...p, status: value === 'all' ? undefined : (value as any) })); setPage(1); }}>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar</h3>
            <p className="text-muted-foreground mb-4">{(error as any)?.message || 'Tente novamente mais tarde.'}</p>
            <Button onClick={() => refetch()} disabled={isFetching}>Tentar novamente</Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma OS encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filters.status ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira Ordem de Serviço.'}
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
          {items.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.os_numero_humano}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <div><strong>Nome:</strong> {order.clientes?.nome || 'Cliente não encontrado'}</div>
                      <div><strong>Telefone:</strong> {order.clientes?.telefone || 'Não informado'}</div>
                      <div><strong>Email:</strong> {order.clientes?.email || 'Não informado'}</div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">•••</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/os/${order.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Ver/Editar
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
                      <DropdownMenuItem onClick={() => handleDuplicate(order)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{formatDate(order.data)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <StatusDropdown
                    osId={order.id}
                    currentStatus={order.status}
                    onStatusChange={() => refetch()}
                  />
                  <span className="font-semibold text-lg">{formatCurrency(order.total_geral)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Badge variant="outline" className={SYNC_STATUS_CONFIG[order.sync_status].color}>
                    {SYNC_STATUS_CONFIG[order.sync_status].label}
                  </Badge>
                  <span className="text-muted-foreground">{formatDate(order.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isFetching}>
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">Página {page} de {pagination.pages}</span>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages || isFetching}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
