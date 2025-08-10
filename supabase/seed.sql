-- Seed de exemplo para testes locais
-- Observação: ajuste os UUIDs conforme necessário

insert into public.clientes (id, nome, telefone, email)
values
  ('5f9e4b2e-ef9d-4c28-842f-3237815a9888', 'vanzer', '+5551984613253', 'vanzer@example.com')
, ('25ad6e54-3bdd-43bf-93aa-de332b4ad688', 'Luis', '+5551982588547', 'luis@example.com')
, ('59cbb991-dadf-44e3-baec-a61d1286881c', 'Ze', '+5554963525263', 'ze@example.com')
ON CONFLICT (id) DO NOTHING;

insert into public.ordens_servico (id, os_numero_humano, cliente_id, data, status, forma_pagamento, garantia, observacoes, total_servicos, total_produtos, total_despesas, total_geral, sync_status)
values
  ('4b17ce9b-6d1f-45e4-8404-15c20b660674','OS-202508-75891','5f9e4b2e-ef9d-4c28-842f-3237815a9888', now(), 'concluida','boleto','90 dias','Precisa trocar carburador',140,104,25,269,'synced')
, ('37570c8e-eb65-4b3b-aec4-f152a1554288','OS-202508-75459','5f9e4b2e-ef9d-4c28-842f-3237815a9888', now(), 'em_andamento','pix','90','necessita troca do cabo de aceleração',150,191,0,341,'synced')
ON CONFLICT (id) DO NOTHING;

insert into public.servicos_os (ordem_servico_id, nome_servico, quantidade, valor_unitario, valor_total)
select '4b17ce9b-6d1f-45e4-8404-15c20b660674','Troca de correia',1,140,140
union all select '37570c8e-eb65-4b3b-aec4-f152a1554288','Ajuste de cabos',1,150,150;

insert into public.produtos_os (ordem_servico_id, nome_produto, quantidade, valor_unitario, valor_total)
select '4b17ce9b-6d1f-45e4-8404-15c20b660674','Correia',1,104,104
union all select '37570c8e-eb65-4b3b-aec4-f152a1554288','Cabo de aceleração',1,191,191;
