import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Phone, Mail, User } from "lucide-react";

// Função utilitária para gerar iniciais do nome
function getInitials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

import { Button } from "@/components/ui/button";
import { ImportarContatoButton } from "@/components/ImportarContatoButton";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { apiClient } from "@/lib/api";
import { Cliente, formatDate } from "@/lib/types";

export default function Clientes() {
  const { toast } = useToast();
  // Lista completa de clientes do backend
  // Lista completa de clientes do backend (sempre array)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  // Lista filtrada para exibição (sempre array)
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
  });


  // Busca todos os clientes do backend Supabase (sem filtro remoto)
  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.listClients();
      // Defensive: garante array mesmo se data vier null, objeto ou array
      let arr: Cliente[] = [];
      if (response && response.ok && response.data && Array.isArray(response.data.items)) {
        arr = response.data.items;
      }
      setClientes(arr);
    } catch (error) {
      setClientes([]);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os clientes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualiza a lista filtrada localmente conforme busca
  useEffect(() => {
    if (!searchQuery) {
      setFilteredClientes(clientes);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredClientes(
        (Array.isArray(clientes) ? clientes : []).filter(
          (c) =>
            c.nome.toLowerCase().includes(q) ||
            (c.telefone && c.telefone.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, clientes]);

  // Busca todos os clientes apenas no carregamento inicial
  useEffect(() => {
    loadClientes();
  }, []);

  const handleSave = async () => {
    if (!formData.nome || !formData.telefone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      if (editingCliente) {
        response = await apiClient.updateClient(editingCliente.id, {
          ...editingCliente,
          ...formData,
          importado_da_agenda: editingCliente.importado_da_agenda ?? false,
          created_at: editingCliente.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        response = await apiClient.createClient({
          id: "",
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          importado_da_agenda: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingCliente ? "Cliente atualizado" : "Cliente criado",
        });
        setShowDialog(false);
        setEditingCliente(null);
        setFormData({ nome: "", telefone: "", email: "" });
        loadClientes();
      } else {
        toast({
          title: "Erro",
          description: response.error?.message || "Erro ao salvar cliente",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const response = await apiClient.deleteClient(id);
      if (response.ok) {
        toast({
          title: "Cliente excluído",
          description: "O cliente foi excluído com sucesso.",
        });
        loadClientes();
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
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingCliente(null);
    setFormData({ nome: "", telefone: "", email: "" });
    setShowDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clientes List */}
      {loading ? (
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
      ) : !Array.isArray(filteredClientes) || filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Tente ajustar os termos de busca."
                : "Comece criando seu primeiro cliente."}
            </p>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(filteredClientes) ? filteredClientes : []).map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  {/* Avatar de iniciais */}
                  <div className="flex items-center mr-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {getInitials(cliente.nome)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{cliente.nome}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Phone className="w-3 h-3 mr-1" />
                      {cliente.telefone}
                    </div>
                    {cliente.email && (
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(cliente.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xs text-muted-foreground">
                  Criado em {formatDate(cliente.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/*
        Dialog para criar/editar cliente.
        Após salvar, loadClientes() é chamado para garantir atualização da lista real do backend.
      */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <ImportarContatoButton
              className="mb-2"
              onImport={({ nome, telefone, email }) => {
                setFormData(prev => ({
                  ...prev,
                  nome: nome || prev.nome,
                  telefone: telefone || prev.telefone,
                  email: email || prev.email,
                }));
              }}
            />
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo do cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="+5511999999999"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCliente ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}