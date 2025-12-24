import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Grid, Chip, Divider,
  List, ListItem, ListItemText, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stepper, Step, StepLabel
} from '@mui/material';
import {
  RestaurantMenu as RestaurantMenuIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function DetalhePedido() {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPedido();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPedido, 30000);
    
    return () => clearInterval(interval);
  }, [id]);
  
  const fetchPedido = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/pedidos/${id}`);
      setPedido(response.data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar detalhes do pedido:', err);
      setError('Não foi possível carregar os detalhes do pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = (novoStatus) => {
    setDialogAction(novoStatus);
    setDialogOpen(true);
  };
  
  const confirmarAcao = async () => {
    try {
      await api.patch(`/api/pedidos/${id}/status`, {
        status: dialogAction
      });
      
      setDialogOpen(false);
      fetchPedido();
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      setError('Não foi possível atualizar o status do pedido. Tente novamente.');
      setDialogOpen(false);
    }
  };
  
  const getStatusColor = (status) => {
    const statusColors = {
      pendente: 'warning',
      em_preparo: 'info',
      pronto: 'success',
      entregue: 'default',
      cancelado: 'error'
    };
    return statusColors[status] || 'default';
  };
  
  const getStatusText = (status) => {
    const statusTexts = {
      pendente: 'Pendente',
      em_preparo: 'Em Preparo',
      pronto: 'Pronto',
      entregue: 'Entregue',
      cancelado: 'Cancelado'
    };
    return statusTexts[status] || status;
  };
  
  const getStatusIndex = (status) => {
    const statusIndices = {
      pendente: 0,
      em_preparo: 1,
      pronto: 2,
      entregue: 3
    };
    return statusIndices[status] !== undefined ? statusIndices[status] : -1;
  };
  
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };
  
  const calcularTempoDecorrido = (dataString) => {
    const data = new Date(dataString);
    const agora = new Date();
    
    const diffMs = agora - data;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutos`;
    } else {
      const diffHrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${diffHrs}h ${mins}min`;
    }
  };
  
  const podeAvancarStatus = (statusAtual) => {
    if (!currentUser) return false;
    
    const permissoesStatus = {
      pendente: ['admin', 'gerente', 'cozinheiro'],
      em_preparo: ['admin', 'gerente', 'cozinheiro'],
      pronto: ['admin', 'gerente', 'garcom']
    };
    
    return permissoesStatus[statusAtual] && permissoesStatus[statusAtual].includes(currentUser.role);
  };
  
  const podeCancelar = () => {
    if (!currentUser || !pedido) return false;
    
    // Apenas admin e gerente podem cancelar pedidos em qualquer status
    if (['admin', 'gerente'].includes(currentUser.role)) return true;
    
    // Garçons só podem cancelar pedidos pendentes
    if (currentUser.role === 'garcom' && pedido.status === 'pendente') return true;
    
    return false;
  };
  
  if (loading && !pedido) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!pedido) {
    return (
      <Box>
        <Alert severity="error">Pedido não encontrado</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pedidos')}
          sx={{ mt: 2 }}
        >
          Voltar para Pedidos
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pedidos')}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        
        <Typography variant="h4">Pedido #{pedido.codigo}</Typography>
        
        <Chip
          label={getStatusText(pedido.status)}
          color={getStatusColor(pedido.status)}
          sx={{ ml: 2 }}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {pedido.status !== 'cancelado' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stepper activeStep={getStatusIndex(pedido.status)}>
            <Step>
              <StepLabel>Pendente</StepLabel>
            </Step>
            <Step>
              <StepLabel>Em Preparo</StepLabel>
            </Step>
            <Step>
              <StepLabel>Pronto</StepLabel>
            </Step>
            <Step>
              <StepLabel>Entregue</StepLabel>
            </Step>
          </Stepper>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações do Pedido
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Mesa
              </Typography>
              <Typography variant="body1">
                Mesa {pedido.mesa.numero}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Garçom
              </Typography>
              <Typography variant="body1">
                {pedido.garcom ? pedido.garcom.nome : 'Não atribuído'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Data e Hora
              </Typography>
              <Typography variant="body1">
                {formatarData(pedido.created_at)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Tempo Decorrido
              </Typography>
              <Typography variant="body1">
                {calcularTempoDecorrido(pedido.created_at)}
              </Typography>
            </Box>
            
            {pedido.observacoes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Observações
                </Typography>
                <Typography variant="body1">
                  {pedido.observacoes}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              {pedido.status === 'pendente' && podeAvancarStatus('pendente') && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => handleStatusChange('em_preparo')}
                >
                  Iniciar Preparo
                </Button>
              )}
              
              {pedido.status === 'em_preparo' && podeAvancarStatus('em_preparo') && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => handleStatusChange('pronto')}
                >
                  Marcar como Pronto
                </Button>
              )}
              
              {pedido.status === 'pronto' && podeAvancarStatus('pronto') && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => handleStatusChange('entregue')}
                >
                  Confirmar Entrega
                </Button>
              )}
              
              {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && podeCancelar() && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => handleStatusChange('cancelado')}
                >
                  Cancelar Pedido
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Itens do Pedido
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {pedido.itens.map((item) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{ mb: 2, p: 2 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {item.quantidade}x {item.produto.nome}
                    </Typography>
                    <Typography variant="subtitle1">
                      R$ {(parseFloat(item.preco_unitario) * item.quantidade).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Preço unitário: R$ {parseFloat(item.preco_unitario).toFixed(2)}
                  </Typography>
                  
                  {item.observacoes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Obs: {item.observacoes}
                    </Typography>
                  )}
                </Paper>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Valor Total
              </Typography>
              <Typography variant="h6" color="primary">
                R$ {parseFloat(pedido.valor_total).toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>
          {dialogAction === 'cancelado'
            ? 'Confirmar Cancelamento'
            : 'Confirmar Alteração de Status'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogAction === 'cancelado'
              ? `Tem certeza que deseja cancelar o Pedido #${pedido.codigo}?`
              : `Tem certeza que deseja alterar o status do Pedido #${pedido.codigo} para "${getStatusText(dialogAction)}"?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmarAcao} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DetalhePedido;
