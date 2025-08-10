# Documentação: NovaOSEdicao.tsx

## Visão Geral
O arquivo `NovaOSEdicao.tsx` implementa a tela de criação e edição de Ordem de Serviço (OS) em um sistema React + TypeScript, utilizando Vite, React Hook Form, Zod para validação, e componentes de UI customizados (shadcn/ui). O fluxo é dividido em etapas (wizard), com validação progressiva e integração com backend via Supabase Functions.

## Principais Funcionalidades
- **Wizard de 6 etapas**: Cliente, Equipamento, Serviços, Produtos, Despesas, Resumo & Pagamento.
- **Formulário controlado**: Utiliza React Hook Form com validação Zod (`zodResolver`).
- **Validação robusta**: Todos os campos obrigatórios são validados antes do envio, incluindo regras específicas para telefone, serviços/produtos e forma de pagamento.
- **Feedback ao usuário**: Mensagens de erro amigáveis e bloqueio de envio caso requisitos não sejam atendidos.
- **Integração com backend**: Criação/edição de OS e clientes via API (`apiClient`).
- **Cálculo automático de totais**: Serviços, produtos e despesas são somados automaticamente.
- **Reutilização**: Permite duplicar OS existentes e editar OS já criadas.

## Estrutura do Código
- **Schema de validação**: Definido com Zod (`novaOSSchema`), incluindo regras para todos os campos.
- **Estados principais**:
  - `currentStep`: Etapa atual do wizard.
  - `clientes`: Lista de clientes carregada da API.
  - `loading`, `saving`: Estados de carregamento e salvamento.
- **Formulário**: Inicializado com `useForm`, usando o schema Zod e valores padrão.
- **Carregamento de dados**:
  - Clientes: via `apiClient.listClients()`.
  - OS para edição/duplicação: via `apiClient.getOS()`.
- **Cálculo de totais**: Função `calculateTotals` soma valores de serviços, produtos e despesas.
- **Atualização de itens**: Funções para atualizar totais de produtos e serviços ao alterar quantidade/valor.
- **Navegação entre etapas**: Funções `handleNext` e `handlePrevious` controlam o fluxo do wizard, validando campos conforme necessário.
- **Envio do formulário**: Função `saveOS` valida todos os requisitos, monta o payload em snake_case e envia para a API. Exibe feedback de sucesso ou erro.
- **Validação extra para forma de pagamento**: O botão "Salvar e Finalizar" impede envio se a forma de pagamento não estiver selecionada, exibindo mensagem clara ao usuário.

## Pontos de Atenção
- **Import do zodResolver**: Devido à estrutura do pacote instalada, o import é feito de `@hookform/resolvers/zod/dist/zod`.
- **Validação de forma de pagamento**: O campo é obrigatório para finalizar a OS. O botão "Salvar e Finalizar" está bloqueado e exibe erro se não for preenchido.
- **Payload para API**: Todos os campos são enviados em snake_case, conforme esperado pelo backend Supabase Functions.
- **Mensagens de erro**: São detalhadas e orientam o usuário sobre o que precisa ser corrigido.
- **Campos de valores**: 
  - Serviços: Usa `preco_unitario` e `total` (quantidade sempre é 1)
  - Produtos: Usa `preco_unitario`, `quantidade` e `total` (calculado automaticamente)
  - Despesas: Usa apenas `valor`
- **Cálculo automático**: Os totais são recalculados sempre que há mudança em quantidade ou preço unitário.

## Fluxo de Uso
1. Usuário preenche cada etapa do wizard.
2. Ao tentar avançar, campos obrigatórios são validados.
3. No passo final, o usuário deve selecionar uma forma de pagamento para habilitar o envio.
4. O sistema cria ou atualiza o cliente, monta o payload da OS e envia para a API.
5. Feedback de sucesso ou erro é exibido.

## Manutenção
- Para adicionar novas formas de pagamento, basta incluir novos `SelectItem` no passo 6.
- Para alterar regras de validação, edite o schema Zod.
- Para adaptar o payload, ajuste a montagem do objeto `osData`.

---

*Última atualização: 01/08/2025*
