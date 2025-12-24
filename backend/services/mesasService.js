const supabase = require('../config/supabase');

/**
 * Serviço para gerenciamento de mesas usando Supabase
 */
const mesasService = {
  /**
   * Obter todas as mesas
   */
  async obterTodas() {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        *,
        garcom:garcom_id(id, nome)
      `)
      .order('numero');
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter mesa por ID
   */
  async obterPorId(id) {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        *,
        garcom:garcom_id(id, nome)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter mesa por número
   */
  async obterPorNumero(numero) {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        *,
        garcom:garcom_id(id, nome)
      `)
      .eq('numero', numero)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Criar nova mesa
   */
  async criar(mesa) {
    const { data, error } = await supabase
      .from('mesas')
      .insert([mesa])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Atualizar mesa existente
   */
  async atualizar(id, mesa) {
    const { data, error } = await supabase
      .from('mesas')
      .update(mesa)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Atualizar status da mesa
   */
  async atualizarStatus(id, status, garcomId = null) {
    const updateData = { status };
    if (garcomId) {
      updateData.garcom_id = garcomId;
    }

    // Se a mesa estiver sendo ocupada, registrar o início do tempo
    if (status === 'ocupada') {
      updateData.tempo_ocupacao_inicio = new Date().toISOString();
      updateData.tempo_ocupacao_fim = null;
    }
    
    // Se a mesa estiver sendo liberada, registrar o fim do tempo
    if (status === 'livre' && (await this.obterPorId(id)).status === 'ocupada') {
      updateData.tempo_ocupacao_fim = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('mesas')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Excluir mesa
   */
  async excluir(id) {
    const { error } = await supabase
      .from('mesas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  /**
   * Obter mesas por status
   */
  async obterPorStatus(status) {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        *,
        garcom:garcom_id(id, nome)
      `)
      .eq('status', status)
      .order('numero');
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter mesas por garçom
   */
  async obterPorGarcom(garcomId) {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        *,
        garcom:garcom_id(id, nome)
      `)
      .eq('garcom_id', garcomId)
      .order('numero');
    
    if (error) throw error;
    return data;
  }
};

module.exports = mesasService;
