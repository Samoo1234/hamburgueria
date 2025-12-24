/**
 * Script de migração de dados do MongoDB para o Supabase
 * 
 * Este script ajuda a migrar dados do MongoDB para o Supabase,
 * mantendo a consistência e integridade dos dados.
 */

// Importações necessárias
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');

// Modelos do MongoDB
const Usuario = require('../backend/models/Usuario');
const Produto = require('../backend/models/Produto');
const Mesa = require('../backend/models/Mesa');
const Pedido = require('../backend/models/Pedido');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Chave de serviço (não a anon key)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas!');
  process.exit(1);
}

// Cliente Supabase com chave de serviço para acesso administrativo
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hamburgueria', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

/**
 * Migração de usuários
 */
async function migrarUsuarios() {
  console.log('Iniciando migração de usuários...');
  
  try {
    // Buscar todos os usuários do MongoDB
    const usuarios = await Usuario.find({});
    console.log(`Encontrados ${usuarios.length} usuários no MongoDB`);
    
    for (const usuario of usuarios) {
      // Criar usuário no Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: usuario.email,
        password: usuario.senha, // Nota: pode ser necessário gerar uma nova senha
        email_confirm: true
      });
      
      if (authError) {
        console.error(`Erro ao criar usuário auth para ${usuario.email}:`, authError);
        continue;
      }
      
      // Inserir dados adicionais na tabela usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authUser.user.id,
          nome: usuario.nome,
          cargo: usuario.cargo,
          ativo: usuario.ativo,
          telefone: usuario.telefone,
          data_contratacao: usuario.dataCriacao
        });
      
      if (userError) {
        console.error(`Erro ao inserir dados do usuário ${usuario.email}:`, userError);
        continue;
      }
      
      console.log(`Usuário migrado com sucesso: ${usuario.email}`);
    }
    
    console.log('Migração de usuários concluída!');
  } catch (error) {
    console.error('Erro durante a migração de usuários:', error);
  }
}

/**
 * Migração de produtos
 */
async function migrarProdutos() {
  console.log('Iniciando migração de produtos...');
  
  try {
    // Buscar todos os produtos do MongoDB
    const produtos = await Produto.find({});
    console.log(`Encontrados ${produtos.length} produtos no MongoDB`);
    
    for (const produto of produtos) {
      // Inserir produto no Supabase
      const { error } = await supabase
        .from('produtos')
        .insert({
          nome: produto.nome,
          descricao: produto.descricao,
          preco: produto.preco,
          categoria: produto.categoria,
          imagem: produto.imagem,
          ingredientes: produto.ingredientes,
          disponivel: produto.disponivel,
          destaque: produto.destaque
        });
      
      if (error) {
        console.error(`Erro ao migrar produto ${produto.nome}:`, error);
        continue;
      }
      
      console.log(`Produto migrado com sucesso: ${produto.nome}`);
    }
    
    console.log('Migração de produtos concluída!');
  } catch (error) {
    console.error('Erro durante a migração de produtos:', error);
  }
}

/**
 * Migração de mesas
 */
async function migrarMesas() {
  console.log('Iniciando migração de mesas...');
  
  try {
    // Buscar todas as mesas do MongoDB
    const mesas = await Mesa.find({});
    console.log(`Encontradas ${mesas.length} mesas no MongoDB`);
    
    // Mapeamento de IDs do MongoDB para IDs do Supabase (para garçons)
    const garcomMap = new Map();
    const { data: usuarios } = await supabase.from('usuarios').select('id, email');
    
    if (usuarios) {
      for (const usuario of usuarios) {
        // Aqui precisamos de uma forma de mapear os IDs
        // Uma opção é usar o email como chave de mapeamento
        garcomMap.set(usuario.email, usuario.id);
      }
    }
    
    for (const mesa of mesas) {
      // Buscar email do garçom no MongoDB se existir
      let garcomId = null;
      if (mesa.garcom) {
        const garcom = await Usuario.findById(mesa.garcom);
        if (garcom) {
          garcomId = garcomMap.get(garcom.email) || null;
        }
      }
      
      // Inserir mesa no Supabase
      const { error } = await supabase
        .from('mesas')
        .insert({
          numero: mesa.numero,
          capacidade: mesa.capacidade,
          status: mesa.status,
          garcom_id: garcomId,
          tempo_ocupacao_inicio: mesa.tempoOcupacao?.inicio,
          tempo_ocupacao_fim: mesa.tempoOcupacao?.fim
        });
      
      if (error) {
        console.error(`Erro ao migrar mesa ${mesa.numero}:`, error);
        continue;
      }
      
      console.log(`Mesa migrada com sucesso: ${mesa.numero}`);
    }
    
    console.log('Migração de mesas concluída!');
  } catch (error) {
    console.error('Erro durante a migração de mesas:', error);
  }
}

/**
 * Migração de pedidos e itens
 */
async function migrarPedidos() {
  console.log('Iniciando migração de pedidos...');
  
  try {
    // Buscar todos os pedidos do MongoDB
    const pedidos = await Pedido.find({}).populate('itens.produto');
    console.log(`Encontrados ${pedidos.length} pedidos no MongoDB`);
    
    // Mapeamento de IDs
    const produtoMap = new Map();
    const { data: produtos } = await supabase.from('produtos').select('id, nome');
    if (produtos) {
      for (const produto of produtos) {
        produtoMap.set(produto.nome, produto.id);
      }
    }
    
    const mesaMap = new Map();
    const { data: mesas } = await supabase.from('mesas').select('id, numero');
    if (mesas) {
      for (const mesa of mesas) {
        mesaMap.set(mesa.numero, mesa.id);
      }
    }
    
    const garcomMap = new Map();
    const { data: usuarios } = await supabase.from('usuarios').select('id, email');
    if (usuarios) {
      for (const usuario of usuarios) {
        garcomMap.set(usuario.email, usuario.id);
      }
    }
    
    for (const pedido of pedidos) {
      // Buscar IDs mapeados
      let mesaId = null;
      let garcomId = null;
      
      if (pedido.mesa) {
        const mesa = await Mesa.findById(pedido.mesa);
        if (mesa) {
          mesaId = mesaMap.get(mesa.numero);
        }
      }
      
      if (pedido.garcom) {
        const garcom = await Usuario.findById(pedido.garcom);
        if (garcom) {
          garcomId = garcomMap.get(garcom.email);
        }
      }
      
      if (!mesaId || !garcomId) {
        console.error(`Erro: Mesa ou garçom não encontrado para o pedido ${pedido.codigo}`);
        continue;
      }
      
      // Inserir pedido no Supabase
      const { data: novoPedido, error } = await supabase
        .from('pedidos')
        .insert({
          codigo: pedido.codigo,
          mesa_id: mesaId,
          garcom_id: garcomId,
          cliente: pedido.cliente,
          status: pedido.status,
          valor_total: pedido.valorTotal,
          observacoes: pedido.observacoes,
          created_at: pedido.dataCriacao
        })
        .select();
      
      if (error || !novoPedido) {
        console.error(`Erro ao migrar pedido ${pedido.codigo}:`, error);
        continue;
      }
      
      // Migrar itens do pedido
      for (const item of pedido.itens) {
        const produtoNome = item.produto?.nome;
        const produtoId = produtoNome ? produtoMap.get(produtoNome) : null;
        
        if (!produtoId) {
          console.error(`Produto não encontrado para o item do pedido ${pedido.codigo}`);
          continue;
        }
        
        const { error: itemError } = await supabase
          .from('itens_pedido')
          .insert({
            pedido_id: novoPedido[0].id,
            produto_id: produtoId,
            quantidade: item.quantidade,
            preco_unitario: item.precoUnitario,
            observacoes: item.observacoes,
            adicionais: item.adicionais || []
          });
        
        if (itemError) {
          console.error(`Erro ao migrar item do pedido ${pedido.codigo}:`, itemError);
        }
      }
      
      console.log(`Pedido migrado com sucesso: ${pedido.codigo}`);
    }
    
    console.log('Migração de pedidos concluída!');
  } catch (error) {
    console.error('Erro durante a migração de pedidos:', error);
  }
}

/**
 * Função principal para executar todas as migrações
 */
async function executarMigracoes() {
  try {
    console.log('Iniciando processo de migração...');
    
    // Executar migrações em sequência
    await migrarUsuarios();
    await migrarProdutos();
    await migrarMesas();
    await migrarPedidos();
    
    console.log('Processo de migração concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de migração:', error);
  } finally {
    // Fechar conexões
    mongoose.disconnect();
    process.exit(0);
  }
}

// Executar migrações
executarMigracoes();