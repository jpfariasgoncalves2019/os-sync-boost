# Troubleshooting API-OS

Se estiver recebendo 500 no endpoint `api-os`, siga estes passos:

1) Confirmar parâmetros
- Verifique query, page, size: page >= 1, 1 <= size <= 100
- Evite caracteres de controle em query (\n, \r, \t)

2) Logs
- Edge Function faz logs estruturados: [api-os][GET list] e [api-os][GET one]
- Inclui `idempotency-key` como `requestId` para rastrear

3) Rede e CORS
- Confirme que o Options (preflight) responde 204/200
- Verifique headers: Access-Control-Allow-*

4) Banco
- Garanta que as tabelas existam e que RLS não bloqueie o usuário anônimo se você precisa de leitura pública
- Verifique índices (nome_cliente, os_numero_humano, nome_servico, nome_produto)

5) Performance
- Tamanhos de página razoáveis (20-50)
- Use filtros específicos (status, datas)

6) Ajuda
- Utilize o Supabase SQL Editor para rodar os comandos DDL/Índices
- Use o painel de Logs do Supabase para ver os erros do PostgREST
