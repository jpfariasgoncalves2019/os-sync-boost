import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WizardStep } from "@/components/WizardStep";
import { ItemList, MoneyInput } from "@/components/ItemList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { NovaOSForm, Cliente, EquipamentoOS, ServicoOS, ProdutoOS, DespesaOS, formatCurrency } from "@/lib/types";
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneE164 } from "@/lib/format";
import { Phone, User, Wrench, Package, Receipt, FileText, Save, CheckCircle, X } from "lucide-react";

const novaOSSchema = z.object({
  cliente: z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome é obrigatório"),
    telefone: z.string()
      .min(1, "Telefone é obrigatório")
      .refine((val) => {
        const normalized = normalizePhoneNumber(val);
        return validatePhoneE164(normalized);
      }, "Informe um telefone válido com DDD"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
  }),
  equipamento: z.object({
    tipo: z.string().min(1, "Tipo é obrigatório"),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    numero_serie: z.string().optional(),
  }),
  servicos: z.array(z.object({
    nome_servico: z.string().min(1, "Nome do serviço é obrigatório"),
    valor_unitario: z.number().min(0.01, "Valor deve ser maior que zero"),
    valor_total: z.number().min(0.01, "Valor total deve ser maior que zero"),
  })),
  produtos: z.array(z.object({
    nome_produto: z.string().min(1, "Nome do produto é obrigatório"),
    quantidade: z.number().min(1, "Quantidade deve ser maior que zero"),
    valor_unitario: z.number().min(0.01, "Valor unitário deve ser maior que zero"),
    valor_total: z.number().min(0.01, "Valor total deve ser maior que zero"),
  })),
  despesas: z.array(z.object({
    descricao: z.string().min(1, "Descrição é obrigatória"),
    valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  })),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  garantia: z.string().optional(),
  observacoes: z.string().optional(),
});

export default function NovaOSEdicao() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!id;
  const isDuplicating = !!location.state?.duplicateFrom;

  const form = useForm<NovaOSForm>({
    resolver: zodResolver(novaOSSchema),
    defaultValues: {
      cliente: { nome: "", telefone: "", email: "" },
      equipamento: { tipo: "", marca: "", modelo: "", numero_serie: "" },
      servicos: [],
      produtos: [],
      despesas: [],
      forma_pagamento: "",
      garantia: "",
      observacoes: "",
    },
  });

  const { control, watch, setValue, getValues, trigger, formState: { errors } } = form;
  const watchedData = watch();

  // Load clients
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const response = await apiClient.listClients();
        if (response.ok) {
          setClientes(response.data.items);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };
    loadClientes();
  }, []);

  // Load OS data for editing or duplicating
  useEffect(() => {
    const loadOS = async () => {
      if (isDuplicating && location.state?.duplicateFrom) {
        const os = location.state.duplicateFrom;
        setValue("cliente", {
          id: os.cliente_id,
          nome: os.cliente_nome || "",
          telefone: os.cliente_telefone || "",
          email: os.cliente_email || "",
        } as any);
        setValue("equipamento", {
          tipo: os.equipamento?.tipo || "",
          marca: os.equipamento?.marca || "",
          modelo: os.equipamento?.modelo || "",
          numero_serie: os.equipamento?.numero_serie || "",
        });
        setValue("servicos", os.servicos || []);
        setValue("produtos", os.produtos || []);
        setValue("despesas", os.despesas || []);
        setValue("forma_pagamento", os.forma_pagamento || "");
        setValue("garantia", os.garantia || "");
        setValue("observacoes", os.observacoes || "");
        return;
      }

      if (!isEditing || !id) return;
      
      setLoading(true);
      try {
        const response = await apiClient.getOS(id);
        if (response.ok) {
          const os = response.data;
          setValue("cliente", {
            id: os.cliente_id,
            nome: os.cliente_nome || "",
            telefone: os.cliente_telefone || "",
            email: os.cliente_email || "",
          } as any);
          setValue("equipamento", {
            tipo: os.equipamento?.tipo || "",
            marca: os.equipamento?.marca || "",
            modelo: os.equipamento?.modelo || "",
            numero_serie: os.equipamento?.numero_serie || "",
          });
          setValue("servicos", os.servicos || []);
          setValue("produtos", os.produtos || []);
          setValue("despesas", os.despesas || []);
          setValue("forma_pagamento", os.forma_pagamento || "");
          setValue("garantia", os.garantia || "");
          setValue("observacoes", os.observacoes || "");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da OS",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOS();
  }, [id, isEditing, isDuplicating, location.state, setValue, toast]);

  // Calculate totals
  const calculateTotals = () => {
    const total_servicos = watchedData.servicos.reduce((sum, s) => sum + s.valor_total, 0);
    const total_produtos = watchedData.produtos.reduce((sum, p) => sum + p.valor_total, 0);
    const total_despesas = watchedData.despesas.reduce((sum, d) => sum + d.valor, 0);
    const total_geral = total_servicos + total_produtos + total_despesas;

    return { total_servicos, total_produtos, total_despesas, total_geral };
  };

  // Update product total when quantity or unit value changes
  const updateProdutoTotal = (index: number, field: keyof ProdutoOS, value: any) => {
    const produtos = [...watchedData.produtos];
    produtos[index] = { ...produtos[index], [field]: value };
    
    if (field === "quantidade" || field === "valor_unitario") {
      produtos[index].valor_total = produtos[index].quantidade * produtos[index].valor_unitario;
    }
    
    setValue("produtos", produtos);
  };

  // Update service total (same as unit value for services)
  const updateServicoTotal = (index: number, field: keyof ServicoOS, value: any) => {
    const servicos = [...watchedData.servicos];
    servicos[index] = { ...servicos[index], [field]: value };
    
    if (field === "valor_unitario") {
      servicos[index].valor_total = value;
    }
    
    setValue("servicos", servicos);
  };

  const handleNext = async () => {
    const stepValidations = {
      1: ["cliente.nome", "cliente.telefone"],
      2: ["equipamento.tipo"],
      3: [],
      4: [],
      5: [],
      6: ["forma_pagamento"],
    };

    const fieldsToValidate = stepValidations[currentStep as keyof typeof stepValidations];
    
    // Check if at least one service or product exists for step 6
    if (currentStep === 6) {
      if (watchedData.servicos.length === 0 && watchedData.produtos.length === 0) {
        toast({
          title: "Validação",
          description: "Adicione pelo menos um serviço ou produto",
          variant: "destructive",
        });
        return;
      }
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid && currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveOS = async (status: "rascunho" | "aberta") => {
    setSaving(true);
    try {
      // Validação completa do formulário
      const isValid = await trigger();
      if (!isValid) {
        toast({
          title: "Validação",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Validação de itens
      if (watchedData.servicos.length === 0 && watchedData.produtos.length === 0) {
        toast({
          title: "Validação",
          description: "Adicione pelo menos um serviço ou produto",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (status === "aberta" && !watchedData.forma_pagamento) {
        toast({
          title: "Validação",
          description: "Forma de pagamento é obrigatória",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const formData = getValues();
      const totals = calculateTotals();

      // Persistência offline se offline
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const rascunhos = JSON.parse(localStorage.getItem("os_rascunhos") || "[]");
        const rascunho = {
          ...formData,
          status,
          sync_status: "pending",
          data: new Date().toISOString(),
        };
        localStorage.setItem("os_rascunhos", JSON.stringify([...rascunhos, rascunho]));
        toast({
          title: "Offline",
          description: "Rascunho salvo localmente. Será sincronizado quando houver conexão.",
          variant: "default",
        });
        setSaving(false);
        return;
      }

      // Criação/edição de cliente
      let clienteId = formData.cliente.id;
      if (!clienteId) {
        try {
          const clientResponse = await apiClient.createClient({
            nome: formData.cliente.nome,
            telefone: formData.cliente.telefone,
            email: formData.cliente.email || null,
          });
          if (clientResponse.ok) {
            clienteId = clientResponse.data.id;
          } else {
            throw new Error(clientResponse.error?.message || "Erro ao criar cliente");
          }
        } catch (error) {
          console.error("Erro ao criar cliente:", error);
          throw new Error("Erro ao criar cliente");
        }
      }

      // Montar payload
      const osData = {
        cliente_id: clienteId,
        equipamento: formData.equipamento.tipo ? {
          tipo: formData.equipamento.tipo,
          marca: formData.equipamento.marca || null,
          modelo: formData.equipamento.modelo || null,
          numero_serie: formData.equipamento.numero_serie || null,
        } : null,
        servicos: formData.servicos.filter(s => s.nome_servico?.trim() && s.valor_unitario > 0),
        produtos: formData.produtos.filter(p => p.nome_produto?.trim() && p.quantidade > 0 && p.valor_unitario > 0),
        despesas: formData.despesas.filter(d => d.descricao?.trim() && d.valor > 0),
        forma_pagamento: formData.forma_pagamento,
        garantia: formData.garantia || null,
        observacoes: formData.observacoes || null,
        data: new Date().toISOString(),
        status,
        total_servicos: totals.total_servicos,
        total_produtos: totals.total_produtos,
        total_despesas: totals.total_despesas,
        total_geral: totals.total_geral,
      };

      let response;
      if (isEditing && id) {
        response = await apiClient.updateOS(id, osData);
      } else {
        response = await apiClient.createOS(osData);
      }

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: status === "rascunho" ? "Rascunho salvo com sucesso." : "Ordem de serviço salva e finalizada com sucesso.",
        });
        navigate(`/os/${response.data.id}`);
      } else {
        let msg = response.error?.message || "Erro ao salvar OS";
        if (response.error?.details && Array.isArray(response.error.details)) {
          msg += ": " + response.error.details.join(", ");
        }
        
        // Mensagens de erro mais específicas
        switch (response.error?.code) {
          case "VALIDATION_ERROR":
            msg = "Dados inválidos: " + (response.error.details?.join(", ") || "Verifique os campos preenchidos");
            break;
          case "INTERNAL_ERROR":
            msg = "Erro interno do servidor. Tente novamente em alguns instantes.";
            break;
          case "DUPLICATE_CLIENT":
            msg = "Cliente já existe com este telefone e nome";
            break;
          default:
            msg = response.error?.message || "Erro desconhecido ao salvar OS";
        }
        
        throw new Error(msg);
      }
    } catch (error) {
      console.error("Erro ao salvar OS:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar OS",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar OS" : "Nova Ordem de Serviço"}
          </h1>
          {isDuplicating && (
            <Badge variant="secondary" className="mt-2">
              Duplicando OS
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate("/")} className="flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancelar
        </Button>
      </div>

      {/* Step 1: Cliente */}
      {currentStep === 1 && (
        <WizardStep
          title="Cliente"
          description="Selecione um cliente existente ou cadastre um novo"
          currentStep={currentStep}
          totalSteps={6}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isNextDisabled={!watchedData.cliente.nome || !watchedData.cliente.telefone}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Dados do Cliente</h3>
            </div>

            {clientes.length > 0 && (
              <div className="space-y-2">
                <Label>Selecionar Cliente Existente</Label>
                <Select
                  value={watchedData.cliente.id || ""}
                  onValueChange={(value) => {
                    if (value) {
                      const cliente = clientes.find(c => c.id === value);
                      if (cliente) {
                        setValue("cliente", {
                          id: cliente.id,
                          nome: cliente.nome,
                          telefone: cliente.telefone,
                          email: cliente.email || "",
                        } as any);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.telefone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator className="my-4" />

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="cliente.nome"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input {...field} placeholder="Nome completo do cliente" />
                    {errors.cliente?.nome && (
                      <p className="text-sm text-destructive">{errors.cliente.nome.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="cliente.telefone"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input 
                      {...field} 
                      placeholder="(11) 99999-9999"
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      onBlur={(e) => {
                        const normalized = normalizePhoneNumber(e.target.value);
                        field.onChange(normalized);
                      }}
                    />
                    {errors.cliente?.telefone && (
                      <p className="text-sm text-destructive">{errors.cliente.telefone.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="cliente.email"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input {...field} placeholder="email@exemplo.com" />
                    {errors.cliente?.email && (
                      <p className="text-sm text-destructive">{errors.cliente.email.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </WizardStep>
      )}

      {/* Step 2: Equipamento */}
      {currentStep === 2 && (
        <WizardStep
          title="Equipamento"
          description="Informe os dados do equipamento"
          currentStep={currentStep}
          totalSteps={6}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isNextDisabled={!watchedData.equipamento.tipo}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Dados do Equipamento</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="equipamento.tipo"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Input {...field} placeholder="Ex: Smartphone, Notebook, TV" />
                    {errors.equipamento?.tipo && (
                      <p className="text-sm text-destructive">{errors.equipamento.tipo.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="equipamento.marca"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input {...field} placeholder="Ex: Samsung, Apple, LG" />
                  </div>
                )}
              />

              <Controller
                name="equipamento.modelo"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input {...field} placeholder="Ex: Galaxy S21, iPhone 12" />
                  </div>
                )}
              />

              <Controller
                name="equipamento.numero_serie"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Número de Série</Label>
                    <Input {...field} placeholder="Número de série do equipamento" />
                  </div>
                )}
              />
            </div>
          </div>
        </WizardStep>
      )}

      {/* Step 3: Serviços */}
      {currentStep === 3 && (
        <WizardStep
          title="Serviços"
          description="Adicione os serviços que serão realizados"
          currentStep={currentStep}
          totalSteps={6}
          onNext={handleNext}
          onPrevious={handlePrevious}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Serviços</h3>
            </div>

            <ItemList
              items={watchedData.servicos}
              onAddItem={() => setValue("servicos", [...watchedData.servicos, { nome_servico: "", valor_unitario: 0, valor_total: 0 }])}
              onRemoveItem={(index) => setValue("servicos", watchedData.servicos.filter((_, i) => i !== index))}
              onUpdateItem={updateServicoTotal}
              addButtonText="Adicionar Serviço"
              emptyMessage="Nenhum serviço adicionado. Clique em 'Adicionar Serviço' para começar."
            >
              {(servico, index, updateField) => (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nome do Serviço *</Label>
                    <Input
                      value={servico.nome_servico}
                      onChange={(e) => updateField("nome_servico", e.target.value)}
                      placeholder="Ex: Troca de tela"
                    />
                  </div>
                  <MoneyInput
                    label="Valor *"
                    value={servico.valor_unitario}
                    onChange={(value) => updateField("valor_unitario", value)}
                    placeholder="0,00"
                  />
                  <MoneyInput
                    label="Total"
                    value={servico.valor_total}
                    onChange={() => {}} // Read-only for services
                    disabled
                  />
                </div>
              )}
            </ItemList>
          </div>
        </WizardStep>
      )}

      {/* Step 4: Produtos */}
      {currentStep === 4 && (
        <WizardStep
          title="Produtos"
          description="Adicione os produtos utilizados"
          currentStep={currentStep}
          totalSteps={6}
          onNext={handleNext}
          onPrevious={handlePrevious}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Produtos</h3>
            </div>

            <ItemList
              items={watchedData.produtos}
              onAddItem={() => setValue("produtos", [...watchedData.produtos, { nome_produto: "", quantidade: 1, valor_unitario: 0, valor_total: 0 }])}
              onRemoveItem={(index) => setValue("produtos", watchedData.produtos.filter((_, i) => i !== index))}
              onUpdateItem={updateProdutoTotal}
              addButtonText="Adicionar Produto"
              emptyMessage="Nenhum produto adicionado. Clique em 'Adicionar Produto' para começar."
            >
              {(produto, index, updateField) => (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Nome do Produto *</Label>
                    <Input
                      value={produto.nome_produto}
                      onChange={(e) => updateField("nome_produto", e.target.value)}
                      placeholder="Ex: Tela LCD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={produto.quantidade}
                      onChange={(e) => updateField("quantidade", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <MoneyInput
                    label="Valor Unitário *"
                    value={produto.valor_unitario}
                    onChange={(value) => updateField("valor_unitario", value)}
                    placeholder="0,00"
                  />
                  <MoneyInput
                    label="Total"
                    value={produto.valor_total}
                    onChange={() => {}} // Read-only, calculated automatically
                    disabled
                  />
                </div>
              )}
            </ItemList>
          </div>
        </WizardStep>
      )}

      {/* Step 5: Despesas */}
      {currentStep === 5 && (
        <WizardStep
          title="Despesas"
          description="Adicione despesas relacionadas ao serviço"
          currentStep={currentStep}
          totalSteps={6}
          onNext={handleNext}
          onPrevious={handlePrevious}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Despesas</h3>
            </div>

            <ItemList
              items={watchedData.despesas}
              onAddItem={() => setValue("despesas", [...watchedData.despesas, { descricao: "", valor: 0 }])}
              onRemoveItem={(index) => setValue("despesas", watchedData.despesas.filter((_, i) => i !== index))}
              onUpdateItem={(index, field, value) => {
                const despesas = [...watchedData.despesas];
                despesas[index] = { ...despesas[index], [field]: value };
                setValue("despesas", despesas);
              }}
              addButtonText="Adicionar Despesa"
              emptyMessage="Nenhuma despesa adicionada. Clique em 'Adicionar Despesa' para começar."
            >
              {(despesa, index, updateField) => (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input
                      value={despesa.descricao}
                      onChange={(e) => updateField("descricao", e.target.value)}
                      placeholder="Ex: Transporte"
                    />
                  </div>
                  <MoneyInput
                    label="Valor *"
                    value={despesa.valor}
                    onChange={(value) => updateField("valor", value)}
                    placeholder="0,00"
                  />
                </div>
              )}
            </ItemList>
          </div>
        </WizardStep>
      )}

      {/* Step 6: Resumo & Pagamento */}
      {currentStep === 6 && (
        <WizardStep
          title="Resumo & Pagamento"
          description="Revise os dados e finalize a OS"
          currentStep={currentStep}
          totalSteps={6}
          onNext={() => {}}
          onPrevious={handlePrevious}
          showStepIndicator={false}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Resumo & Pagamento</h3>
            </div>

            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo dos Totais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Serviços ({watchedData.servicos.length} itens):</span>
                  <span className="font-medium">{formatCurrency(totals.total_servicos)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produtos ({watchedData.produtos.length} itens):</span>
                  <span className="font-medium">{formatCurrency(totals.total_produtos)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Despesas ({watchedData.despesas.length} itens):</span>
                  <span className="font-medium">{formatCurrency(totals.total_despesas)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Geral:</span>
                  <span className="text-primary">{formatCurrency(totals.total_geral)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Forma de pagamento */}
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="forma_pagamento"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Forma de Pagamento *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.forma_pagamento && (
                      <p className="text-sm text-destructive">{errors.forma_pagamento.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="garantia"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Garantia</Label>
                    <Input {...field} placeholder="Ex: 90 dias" />
                  </div>
                )}
              />
            </div>

            <Controller
              name="observacoes"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    {...field}
                    placeholder="Observações adicionais sobre o serviço..."
                    rows={3}
                  />
                </div>
              )}
            />

            {/* Ações finais */}
            <div className="flex justify-between gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={saving}
                className="flex items-center gap-2"
              >
                Anterior
              </Button>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => saveOS("rascunho")}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar como Rascunho"}
                </Button>

                <Button
                  onClick={() => {
                    if (!watchedData.forma_pagamento) {
                      toast({
                        title: "Validação",
                        description: "Selecione uma forma de pagamento antes de finalizar.",
                        variant: "destructive",
                      });
                      return;
                    }
                    saveOS("aberta");
                  }}
                  disabled={saving || (watchedData.servicos.length === 0 && watchedData.produtos.length === 0)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar e Finalizar"}
                </Button>
              </div>
            </div>
          </div>
        </WizardStep>
      )}
    </div>
  );
}