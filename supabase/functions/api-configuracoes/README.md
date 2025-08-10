# Função Serverless: Configurações da Empresa

Endpoint para persistência e consulta dos dados da empresa do usuário.

---

## URL
`/functions/v1/api-configuracoes`

> Ajuste conforme o deploy do Supabase.

## Autenticação
Requer header:
```
Authorization: Bearer <jwt_do_usuario>
```

---

## Métodos

### GET — Buscar dados da empresa

**Request:**
```http
GET /functions/v1/api-configuracoes
Authorization: Bearer <jwt_do_usuario>
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "nome_fantasia": "Oficina do Luis",
    "cnpj": "00.000.000/0001-00",
    "telefone": "(11) 99999-9999",
    "endereco": "Rua Exemplo, 123 - São Paulo/SP",
    "logo_empresa": null
  }
}
```

---

### POST/PUT — Salvar/atualizar dados da empresa

**Request:**
```http
POST /functions/v1/api-configuracoes
Authorization: Bearer <jwt_do_usuario>
Content-Type: application/json

{
  "nome_fantasia": "Oficina do Luis",
  "cnpj": "00.000.000/0001-00",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Exemplo, 123 - São Paulo/SP",
  "logo_empresa": null
}
```

**Response:**
```json
{
  "ok": true
}
```

---

## Erros comuns
- 401: Usuário não autenticado
- 400: Campo obrigatório ausente
- 500: Erro interno ao acessar o banco

---

## Observações
- O campo `logo_empresa` pode ser utilizado para armazenar a URL da logo da empresa (opcional).
- O endpoint aceita tanto POST quanto PUT para atualização dos dados.
