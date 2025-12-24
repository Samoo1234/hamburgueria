import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Grid, Chip, Divider,
  List, ListItem, ListItemText, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Snackbar
} from '@mui/material';
import {
  RestaurantMenu as RestaurantMenuIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function DetalheMesa() {
  const [mesa, setMesa] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estados para fechamento de conta
  const [fecharContaDialogOpen, setFecharContaDialogOpen] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState('');
  const [fechandoConta, setFechandoConta] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMesaEPedidos();
    fetchFormasPagamento();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMesaEPedidos, 30000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchFormasPagamento = async () => {
    try {
      const response = await api.get('/api/financeiro/formas-pagamento');
      setFormasPagamento(response.data);
    } catch (err) {
      console.error('Erro ao buscar formas de pagamento:', err);
    }
  };

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
      navigate('/mesas');
    } catch (err) {
      console.error('Erro ao liberar mesa:', err);
      setError('Não foi possível liberar a mesa. Tente novamente.');
      setDialogOpen(false);
    }
  };

  // Handlers de fechamento de conta
  const handleAbrirFecharConta = () => {
    setFecharContaDialogOpen(true);
  };

  const handleFecharConta = async () => {
    if (!formaPagamentoSelecionada) {
      setError('Selecione uma forma de pagamento');
      return;
    }

    try {
      setFechandoConta(true);
      const response = await api.post(`/api/pedidos/mesa/${id}/fechar-conta`, {
        forma_pagamento_id: formaPagamentoSelecionada
      });

      setFecharContaDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Conta fechada! Total: R$ ${response.data.valorTotal?.toFixed(2)} - ${response.data.formaPagamento}`,
        severity: 'success'
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/mesas');
      }, 2000);
    } catch (err) {
      console.error('Erro ao fechar conta:', err);
      setError(err.response?.data?.mensagem || 'Erro ao fechar conta. Tente novamente.');
    } finally {
      setFechandoConta(false);
    }
  };

  const handleMarcarEntregue = async (pedidoId) => {
    try {
      await api.patch(`/api/pedidos/${pedidoId}/status`, {
        status: 'entregue'
      });
      fetchMesaEPedidos();
    } catch (err) {
      console.error('Erro ao marcar pedido como entregue:', err);
      setError('Erro ao atualizar status do pedido.');
    }
  };

  // Verificar se pode fechar conta
  // Mostra o botão se há pedidos não-cancelados (incluindo entregues que ainda não foram pagos)
  const podeFechaConta = () => {
    const pedidosNaoCancelados = pedidos.filter(p => p.status !== 'cancelado');
    return pedidosNaoCancelados.length > 0 && mesa?.status !== 'livre';
  };

  const temPedidosPendentes = () => {
    return pedidos.some(p => ['pendente', 'em_preparo'].includes(p.status));
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
          onClick={() => navigate('/mesas')}
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
          onClick={() => navigate('/mesas')}
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
                disabled={mesa.status === 'livre'}
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

              {podeFechaConta() && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={<ReceiptIcon />}
                  onClick={handleAbrirFecharConta}
                >
                  Fechar Conta
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

                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/pedidos/${pedido.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        {pedido.status === 'pronto' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleMarcarEntregue(pedido.id)}
                          >
                            Marcar Entregue
                          </Button>
                        )}
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

      {/* Dialog de Fechar Conta */}
      <Dialog
        open={fecharContaDialogOpen}
        onClose={() => setFecharContaDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            Fechar Conta - Mesa {mesa?.numero}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumo da Conta
            </Typography>

            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Pedidos ativos: {pedidos.filter(p => !['cancelado', 'entregue'].includes(p.status)).length}
              </Typography>
              <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                Total: R$ {calcularValorTotal().toFixed(2)}
              </Typography>
            </Box>

            {temPedidosPendentes() && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Atenção: Existem pedidos pendentes ou em preparo. Recomendamos aguardar a finalização.
              </Alert>
            )}

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="forma-pagamento-label">Forma de Pagamento</InputLabel>
              <Select
                labelId="forma-pagamento-label"
                value={formaPagamentoSelecionada}
                label="Forma de Pagamento"
                onChange={(e) => setFormaPagamentoSelecionada(e.target.value)}
              >
                {formasPagamento.map((forma) => (
                  <MenuItem key={forma.id} value={forma.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon fontSize="small" />
                      {forma.nome}
                      {forma.taxa_percentual > 0 && (
                        <Chip label={`${forma.taxa_percentual}%`} size="small" color="warning" />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFecharContaDialogOpen(false)} disabled={fechandoConta}>
            Cancelar
          </Button>
          <Button
            onClick={handleFecharConta}
            variant="contained"
            color="success"
            disabled={fechandoConta || !formaPagamentoSelecionada}
            startIcon={fechandoConta ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {fechandoConta ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DetalheMesa;
