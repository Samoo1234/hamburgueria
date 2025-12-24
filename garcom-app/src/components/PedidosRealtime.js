import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import supabase from '../services/supabase';

/**
 * Componente que demonstra a funcionalidade de tempo real do Supabase
 * para monitorar atualizações nos pedidos
 */
const PedidosRealtime = ({ mesaId }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useSupabaseAuth();

  useEffect(() => {
    // Função para carregar os pedidos iniciais
    const carregarPedidos = async () => {
      try {
        setLoading(true);
        
        // Consulta inicial para buscar pedidos da mesa
        const { data, error } = await supabase
          .from('pedidos')
          .select('*, itens_pedido(*)') // Seleciona pedidos com seus itens
          .eq('mesa_id', mesaId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPedidos(data || []);
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
        setError('Não foi possível carregar os pedidos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    // Carregar pedidos iniciais
    carregarPedidos();

    // Configurar inscrição em tempo real para atualizações de pedidos
    const subscription = supabase
      .channel('pedidos-changes')
      .on('postgres_changes', {
        event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'pedidos',
        filter: `mesa_id=eq.${mesaId}` // Filtrar apenas para a mesa atual
      }, (payload) => {
        console.log('Mudança em pedidos:', payload);
        
        // Atualizar a lista de pedidos com base no tipo de evento
        if (payload.eventType === 'INSERT') {
          setPedidos(pedidosAtuais => [payload.new, ...pedidosAtuais]);
        } else if (payload.eventType === 'UPDATE') {
          setPedidos(pedidosAtuais => 
            pedidosAtuais.map(pedido => 
              pedido.id === payload.new.id ? payload.new : pedido
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setPedidos(pedidosAtuais => 
            pedidosAtuais.filter(pedido => pedido.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    // Configurar inscrição para atualizações de itens de pedido
    const itemsSubscription = supabase
      .channel('itens-pedido-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'itens_pedido',
        // Não podemos filtrar diretamente por mesa_id aqui, então recarregamos os pedidos
      }, () => {
        // Quando houver mudanças nos itens, recarregar os pedidos
        carregarPedidos();
      })
      .subscribe();

    // Limpar inscrições quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
      itemsSubscription.unsubscribe();
    };
  }, [mesaId]);

  // Função para atualizar o status de um pedido
  const atualizarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);
      
      if (error) throw error;
      
      // Não precisamos atualizar o estado manualmente
      // A atualização em tempo real cuidará disso
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status. Tente novamente.');
    }
  };

  if (loading) return <div>Carregando pedidos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="pedidos-realtime">
      <h2>Pedidos da Mesa {mesaId}</h2>
      
      {pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado para esta mesa.</p>
      ) : (
        <ul className="pedidos-lista">
          {pedidos.map(pedido => (
            <li key={pedido.id} className={`pedido-item status-${pedido.status}`}>
              <div className="pedido-header">
                <h3>Pedido {pedido.codigo}</h3>
                <span className="pedido-status">{pedido.status}</span>
              </div>
              
              <div className="pedido-info">
                <p>Total: R$ {pedido.valor_total.toFixed(2)}</p>
                <p>Data: {new Date(pedido.created_at).toLocaleString()}</p>
              </div>
              
              {/* Botões de ação baseados no status atual e cargo do usuário */}
              <div className="pedido-acoes">
                {currentUser?.cargo === 'garcom' && pedido.status === 'pendente' && (
                  <button 
                    onClick={() => atualizarStatusPedido(pedido.id, 'cancelado')}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                )}
                
                {currentUser?.cargo === 'garcom' && pedido.status === 'pronto' && (
                  <button 
                    onClick={() => atualizarStatusPedido(pedido.id, 'entregue')}
                    className="btn-entregar"
                  >
                    Marcar como Entregue
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PedidosRealtime;