const supabase = require('../config/supabase');

/**
 * Serviço para gerenciamento de pedidos usando Supabase
 */
const pedidosService = {
  /**
   * Obter todos os pedidos
   */
  async obterTodos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesa_id(id, numero),
        garcom:garcom_id(id, nome),
        itens:itens_pedido(
          id,
          quantidade,
          preco_unitario,
          observacoes,
          adicionais,
          produto:produto_id(id, nome, categoria, imagem)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter pedido por ID
   */
  async obterPorId(id) {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesa_id(id, numero),
        garcom:garcom_id(id, nome),
        itens:itens_pedido(
          id,
          quantidade,
          preco_unitario,
          observacoes,
          adicionais,
          produto:produto_id(id, nome, categoria, imagem)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter pedidos por status
   */
  async obterPorStatus(status) {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesa_id(id, numero),
        garcom:garcom_id(id, nome),
        itens:itens_pedido(
          id,
          quantidade,
          preco_unitario,
          observacoes,
          adicionais,
          produto:produto_id(id, nome, categoria, imagem)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter pedidos por mesa
   */
  async obterPorMesa(mesaId) {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesa_id(id, numero),
        garcom:garcom_id(id, nome),
        itens:itens_pedido(
          id,
          quantidade,
          preco_unitario,
          observacoes,
          adicionais,
          produto:produto_id(id, nome, categoria, imagem)
        )
      `)
      .eq('mesa_id', mesaId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter pedidos por garçom
   */
  async obterPorGarcom(garcomId) {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesa_id(id, numero),
        garcom:garcom_id(id, nome),
        itens:itens_pedido(
          id,
          quantidade,
          preco_unitario,
          observacoes,
          adicionais,
          produto:produto_id(id, nome, categoria, imagem)
        )
      `)
      .eq('garcom_id', garcomId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Criar novo pedido
   */
  async criar(pedido) {
    // Iniciar transação
    const { data: novoPedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        mesa_id: pedido.mesa_id,
        garcom_id: pedido.garcom_id,
        cliente: pedido.cliente,
        observacoes: pedido.observacoes,
        status: 'pendente'
      }])
      .select();
    
    if (pedidoError) throw pedidoError;
    
    // Adicionar itens ao pedido
    if (pedido.itens && pedido.itens.length > 0) {
      const itensParaInserir = pedido.itens.map(item => ({
        pedido_id: novoPedido[0].id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        observacoes: item.observacoes,
        adicionais: item.adicionais || []
      }));
      
      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir);
      
      if (itensError) throw itensError;
    }
    
    // Buscar o pedido completo com itens
    return await this.obterPorId(novoPedido[0].id);
  },

  /**
   * Atualizar status do pedido
   */
  async atualizarStatus(id, status) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Adicionar item ao pedido
   */
  async adicionarItem(pedidoId, item) {
    const { data, error } = await supabase
      .from('itens_pedido')
      .insert([{
        pedido_id: pedidoId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        observacoes: item.observacoes,
        adicionais: item.adicionais || []
      }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Atualizar item do pedido
   */
  async atualizarItem(itemId, item) {
    const { data, error } = await supabase
      .from('itens_pedido')
      .update({
        quantidade: item.quantidade,
        observacoes: item.observacoes,
        adicionais: item.adicionais || []
      })
      .eq('id', itemId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Remover item do pedido
   */
  async removerItem(itemId) {
    const { error } = await supabase
      .from('itens_pedido')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
    return { success: true };
  },

  /**
   * Cancelar pedido
   */
  async cancelar(id) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

module.exports = pedidosService;
