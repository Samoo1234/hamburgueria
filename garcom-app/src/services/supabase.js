import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificação de segurança para as chaves do Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: As variáveis de ambiente do Supabase não estão configuradas!');
}

// Criação do cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções de autenticação
export const signIn = async (email, senha) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Funções para produtos
export const getProdutos = async () => {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data;
};

// Funções para mesas
export const getMesas = async () => {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .order('numero');
  
  if (error) throw error;
  return data;
};

export const atualizarStatusMesa = async (id, status, garcomId = null) => {
  const { data, error } = await supabase
    .from('mesas')
    .update({ 
      status, 
      garcom_id: garcomId,
      tempo_ocupacao_inicio: status === 'ocupada' ? new Date().toISOString() : null
    })
    .eq('id', id);
  
  if (error) throw error;
  return data;
};

// Funções para pedidos
export const criarPedido = async (pedidoData) => {
  const { data, error } = await supabase
    .from('pedidos')
    .insert(pedidoData)
    .select();
  
  if (error) throw error;
  return data;
};

export const getPedidosPorMesa = async (mesaId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, itens(*)')
    .eq('mesa_id', mesaId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const atualizarStatusPedido = async (id, status) => {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
  return data;
};

// Exporta o cliente Supabase para uso direto quando necessário
export default supabase;