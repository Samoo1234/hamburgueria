# Integração do Supabase no Sistema de Hamburgueria

Este documento descreve a estrutura e configuração do Supabase para o sistema de hamburgueria, incluindo o aplicativo para garçons.

## Visão Geral

O Supabase é uma alternativa de código aberto ao Firebase, oferecendo:
- Banco de dados PostgreSQL
- Autenticação
- Armazenamento
- API instantânea
- Funções em tempo real

Esta integração permite manter o sistema atual com MongoDB enquanto adiciona recursos do Supabase gradualmente.

## Estrutura de Arquivos

```
hamburgueria/
├── supabase/
│   ├── schema.sql       # Definição das tabelas e políticas de segurança
│   └── README.md        # Este documento
├── .env.supabase        # Variáveis de ambiente para o Supabase
└── garcom-app/
    └── src/
        ├── services/
        │   └── supabase.js  # Cliente e funções do Supabase
        └── contexts/
            └── SupabaseAuthContext.js  # Contexto de autenticação
```

## Configuração

### 1. Criar uma conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá para Configurações > API
4. Copie a URL do projeto e a chave anon/public

### 2. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### 3. Configurar o banco de dados

1. No painel do Supabase, vá para SQL Editor
2. Cole o conteúdo do arquivo `schema.sql`
3. Execute o script para criar as tabelas e configurações

### 4. Instalar dependências

```bash
npm install @supabase/supabase-js
```

## Estrutura do Banco de Dados

### Tabelas Principais

1. **usuarios** - Informações dos usuários (complementa auth.users)
2. **produtos** - Catálogo de produtos
3. **mesas** - Mesas do restaurante
4. **pedidos** - Pedidos realizados
5. **itens_pedido** - Itens de cada pedido

## Autenticação

O sistema utiliza a autenticação do Supabase, mantendo compatibilidade com o sistema atual:

- Login via email/senha
- Tokens JWT gerenciados pelo Supabase
- Integração com o contexto de autenticação existente

## Políticas de Segurança (RLS)

O Supabase utiliza Row Level Security (RLS) para controlar o acesso aos dados:

- Garçons podem ver apenas seus próprios pedidos
- Cozinheiros podem atualizar o status dos pedidos
- Admins e gerentes têm acesso completo

## Migração Gradual

A estrutura permite uma migração gradual do MongoDB para o Supabase:

1. Comece usando apenas a autenticação do Supabase
2. Migre gradualmente as funcionalidades para o Supabase
3. Mantenha a compatibilidade com o sistema existente durante a transição

## Recursos em Tempo Real

O Supabase oferece recursos em tempo real que podem ser utilizados para:

- Atualização instantânea do status dos pedidos
- Notificações para garçons e cozinha
- Atualizações de disponibilidade de mesas

Exemplo de uso:

```javascript
supabase
  .from('pedidos')
  .on('UPDATE', payload => {
    console.log('Pedido atualizado:', payload.new);
    // Atualizar interface
  })
  .subscribe();
```

## Próximos Passos

1. Configurar o projeto no Supabase
2. Executar o script de criação de tabelas
3. Integrar a autenticação do Supabase
4. Migrar gradualmente as funcionalidades
5. Implementar recursos em tempo real