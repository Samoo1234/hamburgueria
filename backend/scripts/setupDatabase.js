require('dotenv').config({ path: '../.env' });
const supabase = require('../config/supabase');

async function setupDatabase() {
  try {
    console.log('Iniciando configuração do banco de dados...');
    console.log('URL do Supabase:', process.env.SUPABASE_URL);

    // Criar tabela de usuários
    const { error: usuariosError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS usuarios (
          id UUID PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'garcom',
          ativo BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usuariosError) {
      console.error('Erro ao criar tabela de usuários:', usuariosError);
    } else {
      console.log('Tabela de usuários criada ou já existente.');
    }

    // Criar tabela de produtos
    const { error: produtosError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS produtos (
          id UUID PRIMARY KEY,
          nome TEXT NOT NULL,
          descricao TEXT,
          preco DECIMAL(10, 2) NOT NULL,
          categoria TEXT NOT NULL,
          imagem TEXT,
          disponivel BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (produtosError) {
      console.error('Erro ao criar tabela de produtos:', produtosError);
    } else {
      console.log('Tabela de produtos criada ou já existente.');
    }

    // Criar tabela de mesas
    const { error: mesasError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS mesas (
          id UUID PRIMARY KEY,
          numero INTEGER NOT NULL UNIQUE,
          capacidade INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'livre',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (mesasError) {
      console.error('Erro ao criar tabela de mesas:', mesasError);
    } else {
      console.log('Tabela de mesas criada ou já existente.');
    }

    // Criar tabela de pedidos
    const { error: pedidosError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS pedidos (
          id UUID PRIMARY KEY,
          mesa_id UUID REFERENCES mesas(id),
          usuario_id UUID REFERENCES usuarios(id),
          status TEXT NOT NULL DEFAULT 'pendente',
          valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
          observacao TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (pedidosError) {
      console.error('Erro ao criar tabela de pedidos:', pedidosError);
    } else {
      console.log('Tabela de pedidos criada ou já existente.');
    }

    // Criar tabela de itens de pedido
    const { error: itensPedidoError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS itens_pedido (
          id UUID PRIMARY KEY,
          pedido_id UUID REFERENCES pedidos(id),
          produto_id UUID REFERENCES produtos(id),
          quantidade INTEGER NOT NULL,
          preco_unitario DECIMAL(10, 2) NOT NULL,
          observacao TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (itensPedidoError) {
      console.error('Erro ao criar tabela de itens de pedido:', itensPedidoError);
    } else {
      console.log('Tabela de itens de pedido criada ou já existente.');
    }

    console.log('Configuração do banco de dados concluída.');
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
