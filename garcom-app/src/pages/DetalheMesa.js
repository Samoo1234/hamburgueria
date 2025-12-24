import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Grid, Chip, Divider,
  List, ListItem, ListItemText, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  RestaurantMenu as RestaurantMenuIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function DetalheMesa() {
  const [mesa, setMesa] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMesaEPedidos();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMesaEPedidos, 30000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchMesaEPedidos = async () => {
    try {
      setLoading(true);
      const mesaResponse = await api.get(`/api/mesas/${id}`);
      setMesa(mesaResponse.data);

      const pedidosResponse = await api.get(`/api/pedidos/mesa/${id}`);
      setPedidos(pedidosResponse.data);

      setError('');
    } catch (err) {
      console.error('Erro ao buscar detalhes da mesa:', err);
      setError('Não foi possível carregar os detalhes da mesa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLiberarMesa = () => {
    setDialogOpen(true);
  };

  const confirmarLiberacao = async () => {
    try {
      await api.patch(`/api/mesas/${id}/status`, {
        status: 'livre'
      });

      setDialogOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Erro ao liberar mesa:', err);
      setError('Não foi possível liberar a mesa. Tente novamente.');
      setDialogOpen(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      livre: 'success',
      ocupada: 'default',
      reservada: 'info',
      aguardando_atendimento: 'error',
      em_atendimento: 'primary'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      livre: 'Livre',
      ocupada: 'Ocupada',
      reservada: 'Reservada',
      aguardando_atendimento: 'Aguardando Atendimento',
      em_atendimento: 'Em Atendimento'
    };
    return statusTexts[status] || status;
  };

  const getPedidoStatusColor = (status) => {
    const statusColors = {
      pendente: 'warning',
      em_preparo: 'info',
      pronto: 'success',
      entregue: 'default',
      cancelado: 'error'
    };
    return statusColors[status] || 'default';
  };

  const getPedidoStatusText = (status) => {
    const statusTexts = {
      pendente: 'Pendente',
      em_preparo: 'Em Preparo',
      pronto: 'Pronto',
      entregue: 'Entregue',
      cancelado: 'Cancelado'
    };
    return statusTexts[status] || status;
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  const calcularTempoOcupacao = () => {
    if (!mesa || !mesa.tempo_ocupacao_inicio) return 'N/A';

    const inicio = new Date(mesa.tempo_ocupacao_inicio);
    const agora = new Date();

    const diffMs = agora - inicio;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return `${diffHrs}h ${mins}min`;
  };

  const calcularValorTotal = () => {
    return pedidos
      .filter(p => p.status !== 'cancelado')
      .reduce((total, pedido) => total + parseFloat(pedido.valor_total), 0);
  };

  if (loading && !mesa) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mesa) {
    return (
      <Box>
        <Alert severity="error">Mesa não encontrada</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Voltar para Mesas
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>

        <Typography variant="h4">Mesa {mesa.numero}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Informações da Mesa</Typography>
              <Chip
                label={getStatusText(mesa.status)}
                color={getStatusColor(mesa.status)}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Capacidade
              </Typography>
              <Typography variant="body1">
                {mesa.capacidade} pessoas
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Garçom Responsável
              </Typography>
              <Typography variant="body1">
                {mesa.garcom ? mesa.garcom.nome : 'Nenhum'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Tempo de Ocupação
              </Typography>
              <Typography variant="body1">
                {calcularTempoOcupacao()}
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<RestaurantMenuIcon />}
                onClick={() => navigate(`/mesas/${id}/pedido`)}
              >
                Novo Pedido
              </Button>

              {mesa.status !== 'livre' && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleLiberarMesa}
                >
                  Liberar Mesa
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pedidos da Mesa
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {pedidos.length === 0 ? (
              <Typography variant="body1">
                Nenhum pedido registrado para esta mesa.
              </Typography>
            ) : (
              <>
                <List>
                  {pedidos.map((pedido) => (
                    <Paper
                      key={pedido.id}
                      variant="outlined"
                      sx={{ mb: 2, p: 2 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          Pedido {pedido.codigo}
                        </Typography>
                        <Chip
                          label={getPedidoStatusText(pedido.status)}
                          color={getPedidoStatusColor(pedido.status)}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {formatarData(pedido.created_at)}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <List dense>
                        {pedido.itens.map((item) => (
                          <ListItem key={item.id}>
                            <ListItemText
                              primary={`${item.quantidade}x ${item.produto.nome}`}
                              secondary={`R$ ${(parseFloat(item.preco_unitario) * item.quantidade).toFixed(2)}`}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="subtitle1">
                          Total
                        </Typography>
                        <Typography variant="subtitle1">
                          R$ {parseFloat(pedido.valor_total).toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Valor Total da Mesa
                  </Typography>
                  <Typography variant="h6" color="primary">
                    R$ {calcularValorTotal().toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Confirmar Liberação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja liberar a Mesa {mesa.numero}?
            {pedidos.some(p => ['pendente', 'em_preparo'].includes(p.status)) && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                Atenção: Existem pedidos pendentes ou em preparo para esta mesa.
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmarLiberacao} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DetalheMesa;
