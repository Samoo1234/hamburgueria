const express = require('express');
const router = express.Router();
const pedidosService = require('../services/pedidosService');
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hamburgueria_secret');
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(400).json({ mensagem: 'Token inválido' });
  }
}

// Middleware para verificar se o pedido existe
async function verificarPedido(req, res, next) {
  try {
    const pedido = await pedidosService.obterPorId(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado' });
    }
    req.pedido = pedido;
    next();
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar pedido', error: error.message });
  }
}

// Obter todos os pedidos
router.get('/', verificarToken, async (req, res) => {
  try {
    const { tipo, status, mesa, data } = req.query;
    let filtro = {};

    if (tipo) filtro.tipo = tipo;
    if (status) filtro.status = status;
    if (mesa) filtro.mesa = mesa;

    // Filtrar por data (hoje)
    if (data === 'hoje') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      filtro['tempos.criacao'] = {
        $gte: hoje,
        $lt: amanha
      };
    }

    const pedidos = await pedidosService.obterTodos(filtro);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar pedidos', error: error.message });
  }
});

// Obter pedido por ID
router.get('/:id', verificarToken, verificarPedido, (req, res) => {
  res.json(req.pedido);
});

// Obter pedidos por mesa
router.get('/mesa/:mesaId', verificarToken, async (req, res) => {
  try {
    const { mesaId } = req.params;
    const { status } = req.query;

    let filtro = { mesa: mesaId };
    if (status) filtro.status = status;

    const pedidos = await pedidosService.obterPorMesa(mesaId, filtro);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar pedidos da mesa', error: error.message });
  }
});

// Criar novo pedido
router.post('/', verificarToken, async (req, res) => {
  try {
    const { tipo, mesa: mesaId, cliente, itens, observacoes } = req.body;

    // Validar tipo de pedido
    if (!tipo || !['online', 'presencial'].includes(tipo)) {
      return res.status(400).json({ mensagem: 'Tipo de pedido inválido' });
    }

    // Validar itens do pedido
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ mensagem: 'Itens do pedido são obrigatórios' });
    }

    // Importar serviços necessários
    const mesasService = require('../services/mesasService');
    const produtosService = require('../services/produtosService');

    // Validar mesa para pedidos presenciais
    let mesa = null;
    if (tipo === 'presencial') {
      if (!mesaId) {
        return res.status(400).json({ mensagem: 'Mesa é obrigatória para pedidos presenciais' });
      }

      try {
        mesa = await mesasService.obterPorId(mesaId);
      } catch (err) {
        return res.status(404).json({ mensagem: 'Mesa não encontrada' });
      }

      if (!mesa) {
        return res.status(404).json({ mensagem: 'Mesa não encontrada' });
      }

      // Atualizar status da mesa se necessário
      if (mesa.status === 'livre' || mesa.status === 'reservada') {
        await mesasService.atualizarStatus(mesaId, 'ocupada', req.usuario.id);
      }
    } else if (tipo === 'online') {
      // Validar cliente para pedidos online
      if (!cliente || !cliente.nome) {
        return res.status(400).json({ mensagem: 'Dados do cliente são obrigatórios para pedidos online' });
      }
    }

    // Processar itens do pedido e calcular valor total
    const itensPedido = [];
    let valorTotal = 0;

    for (const item of itens) {
      let produto;
      try {
        produto = await produtosService.obterPorId(item.produto);
      } catch (err) {
        return res.status(404).json({ mensagem: `Produto não encontrado: ${item.produto}` });
      }

      if (!produto) {
        return res.status(404).json({ mensagem: `Produto não encontrado: ${item.produto}` });
      }

      if (produto.disponivel === false) {
        return res.status(400).json({ mensagem: `Produto indisponível: ${produto.nome}` });
      }

      const quantidade = item.quantidade || 1;
      const precoUnitario = parseFloat(produto.preco);
      const valorItem = precoUnitario * quantidade;

      // Calcular valor dos adicionais
      let valorAdicionais = 0;
      if (item.adicionais && Array.isArray(item.adicionais)) {
        for (const adicional of item.adicionais) {
          valorAdicionais += parseFloat(adicional.preco) || 0;
        }
      }

      valorTotal += valorItem + (valorAdicionais * quantidade);

      itensPedido.push({
        produto_id: produto.id,
        quantidade,
        preco_unitario: precoUnitario,
        observacoes: item.observacoes || '',
        adicionais: item.adicionais || []
      });
    }

    // Criar o pedido usando o serviço
    const novoPedido = {
      mesa_id: mesa ? mesa.id : null,
      garcom_id: req.usuario.id, // Sempre associar ao usuário logado
      cliente,
      itens: itensPedido,
      observacoes: observacoes || ''
    };

    const pedidoSalvo = await pedidosService.criar(novoPedido);

    res.status(201).json(pedidoSalvo);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ mensagem: 'Erro ao criar pedido', error: error.message });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', verificarToken, verificarPedido, async (req, res) => {
  try {
    const { status } = req.body;
    // Status válidos - sincronizados com o frontend
    const statusValidos = ['pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado'];

    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido' });
    }

    // Atualizar status usando o serviço do Supabase
    const pedidoAtualizado = await pedidosService.atualizarStatus(req.params.id, status);

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(400).json({ mensagem: 'Erro ao atualizar status do pedido', error: error.message });
  }
});

// Atualizar forma de pagamento
router.patch('/:id/pagamento', verificarToken, verificarPedido, async (req, res) => {
  try {
    const { formaPagamento } = req.body;
    const formasValidas = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'vale_refeicao'];

    if (!formaPagamento || !formasValidas.includes(formaPagamento)) {
      return res.status(400).json({ mensagem: 'Forma de pagamento inválida' });
    }

    // Atualizar forma de pagamento
    req.pedido.formaPagamento = formaPagamento;
    await pedidosService.atualizar(req.pedido);

    res.json(req.pedido);
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao atualizar forma de pagamento', error: error.message });
  }
});

// Adicionar item ao pedido
router.post('/:id/itens', verificarToken, verificarPedido, async (req, res) => {
  try {
    const { produto: produtoId, quantidade, observacoes, adicionais } = req.body;

    // Verificar se o pedido pode ser alterado
    if (['finalizado', 'cancelado'].includes(req.pedido.status)) {
      return res.status(400).json({ mensagem: 'Não é possível adicionar itens a um pedido finalizado ou cancelado' });
    }

    // Verificar se o produto existe e está disponível
    const produto = await pedidosService.obterProduto(produtoId);
    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' });
    }

    if (!produto.disponivel) {
      return res.status(400).json({ mensagem: `Produto indisponível: ${produto.nome}` });
    }

    // Calcular valor do item
    const qtd = quantidade || 1;
    const precoUnitario = produto.preco;
    let valorItem = precoUnitario * qtd;

    // Calcular valor dos adicionais
    const adicionaisItem = [];
    if (adicionais && Array.isArray(adicionais)) {
      for (const adicional of adicionais) {
        valorItem += (adicional.preco || 0) * qtd;
        adicionaisItem.push({
          nome: adicional.nome,
          preco: adicional.preco
        });
      }
    }

    // Adicionar item ao pedido
    const novoItem = {
      produto: produto._id,
      quantidade: qtd,
      precoUnitario,
      observacoes: observacoes || '',
      adicionais: adicionaisItem
    };

    req.pedido.itens.push(novoItem);
    req.pedido.valorTotal += valorItem;

    await pedidosService.atualizar(req.pedido);

    res.json(req.pedido);
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao adicionar item ao pedido', error: error.message });
  }
});

// Remover item do pedido
router.delete('/:id/itens/:itemId', verificarToken, verificarPedido, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Verificar se o pedido pode ser alterado
    if (['finalizado', 'cancelado'].includes(req.pedido.status)) {
      return res.status(400).json({ mensagem: 'Não é possível remover itens de um pedido finalizado ou cancelado' });
    }

    // Encontrar o item no pedido
    const item = req.pedido.itens.id(itemId);
    if (!item) {
      return res.status(404).json({ mensagem: 'Item não encontrado no pedido' });
    }

    // Calcular valor a ser subtraído do total
    const valorItem = item.precoUnitario * item.quantidade;
    let valorAdicionais = 0;

    if (item.adicionais && Array.isArray(item.adicionais)) {
      for (const adicional of item.adicionais) {
        valorAdicionais += adicional.preco || 0;
      }
    }

    const valorTotal = valorItem + (valorAdicionais * item.quantidade);

    // Remover item e atualizar valor total
    req.pedido.itens.pull(itemId);
    req.pedido.valorTotal -= valorTotal;

    // Garantir que o valor total não seja negativo
    if (req.pedido.valorTotal < 0) {
      req.pedido.valorTotal = 0;
    }

    await pedidosService.atualizar(req.pedido);

    res.json(req.pedido);
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao remover item do pedido', error: error.message });
  }
});

// Cancelar pedido
router.patch('/:id/cancelar', verificarToken, verificarPedido, async (req, res) => {
  try {
    // Verificar se o pedido pode ser cancelado
    if (['entregue', 'finalizado', 'cancelado'].includes(req.pedido.status)) {
      return res.status(400).json({ mensagem: 'Não é possível cancelar um pedido entregue, finalizado ou já cancelado' });
    }

    // Atualizar status para cancelado
    req.pedido.status = 'cancelado';
    await pedidosService.atualizar(req.pedido);

    res.json({
      mensagem: 'Pedido cancelado com sucesso',
      pedido: req.pedido
    });
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao cancelar pedido', error: error.message });
  }
});

// Obter conta da mesa (todos os pedidos ativos)
router.get('/mesa/:mesaId/conta', verificarToken, async (req, res) => {
  try {
    const { mesaId } = req.params;

    // Verificar se a mesa existe
    const mesa = await pedidosService.obterMesa(mesaId);
    if (!mesa) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada' });
    }

    // Buscar todos os pedidos ativos da mesa
    const pedidos = await pedidosService.obterPedidosAtivosPorMesa(mesaId);

    // Calcular valor total da conta
    const valorTotal = pedidos.reduce((total, pedido) => total + pedido.valorTotal, 0);

    res.json({
      mesa,
      pedidos,
      valorTotal,
      quantidadePedidos: pedidos.length
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar conta da mesa', error: error.message });
  }
});

// Fechar conta da mesa (finalizar todos os pedidos e liberar mesa)
router.post('/mesa/:mesaId/fechar-conta', verificarToken, async (req, res) => {
  try {
    const { mesaId } = req.params;
    const { forma_pagamento_id } = req.body;

    if (!forma_pagamento_id) {
      return res.status(400).json({ mensagem: 'Forma de pagamento é obrigatória' });
    }

    // Importar supabase
    const supabase = require('../config/supabase');

    // Verificar se a mesa existe
    const { data: mesa, error: erroMesa } = await supabase
      .from('mesas')
      .select('*')
      .eq('id', mesaId)
      .single();

    if (erroMesa || !mesa) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada' });
    }

    // Buscar todos os pedidos não cancelados da mesa (incluindo entregues que ainda não foram pagos)
    const { data: pedidos, error: erroPedidos } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens:itens_pedido(*)
      `)
      .eq('mesa_id', mesaId)
      .neq('status', 'cancelado');

    if (erroPedidos) {
      throw erroPedidos;
    }

    if (!pedidos || pedidos.length === 0) {
      return res.status(400).json({ mensagem: 'Não há pedidos para esta mesa' });
    }

    // Calcular valor total
    const valorTotal = pedidos.reduce((total, pedido) => total + parseFloat(pedido.valor_total || 0), 0);

    // Buscar forma de pagamento para validação
    const { data: formaPagamento, error: erroFormaPag } = await supabase
      .from('formas_pagamento')
      .select('*')
      .eq('id', forma_pagamento_id)
      .single();

    if (erroFormaPag || !formaPagamento) {
      return res.status(400).json({ mensagem: 'Forma de pagamento inválida' });
    }

    // Atualizar status de todos os pedidos para 'entregue'
    const pedidoIds = pedidos.map(p => p.id);
    const { error: erroUpdatePedidos } = await supabase
      .from('pedidos')
      .update({ status: 'entregue' })
      .in('id', pedidoIds);

    if (erroUpdatePedidos) {
      throw erroUpdatePedidos;
    }

    // Buscar caixa aberto para registrar movimentação
    const { data: caixaAberto, error: erroCaixa } = await supabase
      .from('caixa')
      .select('id')
      .eq('status', 'aberto')
      .limit(1)
      .single();

    // Se houver caixa aberto, registrar movimentação
    if (caixaAberto && !erroCaixa) {
      const { error: erroMovimentacao } = await supabase
        .from('movimentacoes_caixa')
        .insert({
          caixa_id: caixaAberto.id,
          tipo: 'entrada',
          valor: valorTotal,
          descricao: `Fechamento Mesa ${mesa.numero} - ${pedidos.length} pedido(s)`,
          forma_pagamento_id: forma_pagamento_id,
          usuario_id: req.usuario.id
        });

      if (erroMovimentacao) {
        console.error('Erro ao registrar movimentação:', erroMovimentacao);
        // Não interrompe o fluxo, apenas loga o erro
      }
    }

    // Liberar a mesa
    const { error: erroLiberarMesa } = await supabase
      .from('mesas')
      .update({
        status: 'livre',
        garcom_id: null,
        tempo_ocupacao_fim: new Date().toISOString()
      })
      .eq('id', mesaId);

    if (erroLiberarMesa) {
      throw erroLiberarMesa;
    }

    res.json({
      mensagem: 'Conta fechada com sucesso',
      valorTotal,
      formaPagamento: formaPagamento.nome,
      pedidosFinalizados: pedidos.length,
      movimentacaoRegistrada: !!caixaAberto
    });
  } catch (error) {
    console.error('Erro ao fechar conta:', error);
    res.status(500).json({ mensagem: 'Erro ao fechar conta da mesa', error: error.message });
  }
});

module.exports = router;