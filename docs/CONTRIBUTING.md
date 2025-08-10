# Guia do Desenvolvedor

Este guia contém informações detalhadas para desenvolvedores trabalhando no projeto Ordem de Serviço.

## 🔧 Stack Técnica

- **Frontend**: React + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Deploy**: Vercel

## 📚 Padrões de Código

### Nomenclatura

- **Arquivos React**: PascalCase (ex: `OrderForm.tsx`)
- **Hooks**: camelCase começando com `use` (ex: `useOrderStatus.ts`)
- **Utilitários**: camelCase (ex: `formatCurrency.ts`)
- **Tipos/Interfaces**: PascalCase (ex: `interface OrderStatus`)
- **Constantes**: SCREAMING_SNAKE_CASE (ex: `MAX_ITEMS_PER_PAGE`)

### Estrutura de Componentes

```tsx
// imports
import { useState } from 'react'
import { useForm } from 'react-hook-form'

// types
interface Props {
  // ...
}

// component
export function ComponentName({ prop1, prop2 }: Props) {
  // hooks primeiro
  const [state, setState] = useState()
  
  // handlers depois
  const handleSubmit = () => {
    // ...
  }

  // render por último
  return (
    // ...
  )
}
```

### Boas Práticas

1. **Performance**
   - Use memo/useMemo para otimizações
   - Evite re-renders desnecessários
   - Lazy load de componentes pesados

2. **Segurança**
   - Valide inputs no cliente e servidor
   - Sanitize dados antes de exibir
   - Use HTTPS sempre

3. **Acessibilidade**
   - Use landmarks semânticos
   - Inclua ARIA labels
   - Teste com teclado

## 🎯 Workflows Comuns

### Adicionando uma Nova Feature

1. Crie uma branch
```bash
git checkout -b feature/nome-feature
```

2. Implemente usando TDD
```bash
# Crie o teste primeiro
npm test -- --watch

# Implemente a feature
code src/features/nova-feature/

# Valide a implementação
npm run lint
npm run test
```

3. Documente
- Adicione JSDoc nos componentes/funções
- Atualize o README se necessário
- Inclua exemplos de uso

4. Abra um PR
- Use o template de PR
- Adicione screenshots/vídeos
- Marque reviewers

### Debug em Produção

1. Habilite logs detalhados
```ts
// .env
VITE_ENABLE_DEBUG_MODE=true
```

2. Use o Supabase Dashboard
- Monitore Edge Functions
- Verifique logs SQL
- Analise métricas de performance

## 🔍 Code Review

### Checklist

- [ ] Código segue style guide
- [ ] Testes cobrem casos principais
- [ ] Performance adequada
- [ ] Sem problemas de segurança
- [ ] Documentação atualizada
- [ ] Migrations testadas
- [ ] Build passa localmente

### O que Procurar

1. **Segurança**
   - SQL Injection
   - XSS
   - CSRF
   - Exposição de dados sensíveis

2. **Performance**
   - Queries N+1
   - Re-renders desnecessários
   - Bundle size
   - Lazy loading

3. **Manutenibilidade**
   - Código duplicado
   - Complexidade ciclomática
   - Nomenclatura clara
   - Documentação

## 📊 Monitoramento

### Métricas Importantes

- Tempo de carregamento
- Erro rate
- CPU/Memory usage
- Database performance
- API latency

### Ferramentas

- Supabase Dashboard
- Vercel Analytics
- Browser DevTools
- Lighthouse

## 🚨 Troubleshooting

### Erros Comuns

1. **Build falha**
```bash
# Limpe caches
rm -rf node_modules
npm clean-install

# Verifique TypeScript
npm run type-check
```

2. **Testes falham**
```bash
# Rode com logs detalhados
npm test -- --verbose

# Limpe cache de testes
npm test -- --clearCache
```

3. **Problemas de Performance**
```bash
# Analise bundle
npm run analyze

# Profile em dev
npm run dev -- --profile
```

## 📝 Templates

### Commit Message

```
<tipo>(<escopo>): <descrição>

[corpo]

[rodapé]
```

Exemplo:
```
feat(os): adiciona validação de equipamentos

- Adiciona schema Zod para validação
- Implementa feedback visual de erros
- Atualiza testes

Closes #123
```

### Pull Request

```md
## Descrição
[Descreva as mudanças implementadas]

## Tipo de mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como testar
1. Faça checkout da branch
2. Rode \`npm install\`
3. [Passos específicos...]

## Screenshots
[Se aplicável]

## Checklist
- [ ] Testes adicionados
- [ ] Documentação atualizada
- [ ] Build passa
- [ ] Lint passa
```
