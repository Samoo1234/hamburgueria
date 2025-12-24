const supabase = require('../config/supabase');

/**
 * Serviço para gerenciamento de produtos usando Supabase
 */
const produtosService = {
  /**
   * Obter todos os produtos
   */
  async obterTodos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter produtos por categoria
   */
  async obterPorCategoria(categoria) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('categoria', categoria)
      .order('nome');
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter produto por ID
   */
  async obterPorId(id) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Criar novo produto
   */
  async criar(produto) {
    const { data, error } = await supabase
      .from('produtos')
      .insert([produto])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Atualizar produto existente
   */
  async atualizar(id, produto) {
    const { data, error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Excluir produto
   */
  async excluir(id) {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  /**
   * Obter produtos em destaque
   */
  async obterDestaques() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('destaque', true)
      .order('nome');
    
    if (error) throw error;
    return data;
  }
};

module.exports = produtosService;
