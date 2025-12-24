import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button,
  CircularProgress, Alert, IconButton, Tabs, Tab
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPedidos();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPedidos, 30000);
    
    return () => clearInterval(interval);
  }, [tabValue]);
  
  const fetchPedidos = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/pedidos';
      
      // Filtrar pedidos com base na tab selecionada
      if (tabValue === 1) {
        endpoint = '/api/pedidos/status/pendente';
      } else if (tabValue === 2) {
        endpoint = '/api/pedidos/status/em_preparo';
      } else if (tabValue === 3) {
        endpoint = '/api/pedidos/status/pronto';
      } else if (tabValue === 4) {
        endpoint = '/api/pedidos/status/entregue';
      } else if (tabValue === 5) {
        endpoint = '/api/pedidos/status/cancelado';
      }
      
      const response = await api.get(endpoint);
      setPedidos(response.data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Não foi possível carregar os pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      await api.patch(`/api/pedidos/${pedidoId}/status`, {
        status: novoStatus
      });
      fetchPedidos();
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      setError('Erro ao atualizar status do pedido.');
    }
  };
  
  const handleCancelarPedido = async (pedidoId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await api.patch(`/api/pedidos/${pedidoId}/cancelar`);
        fetchPedidos();
      } catch (err) {
        console.error('Erro ao cancelar pedido:', err);
        setError('Erro ao cancelar pedido.');
      }
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
  
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };
  
  if (loading && pedidos.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pedidos
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="Todos" />
        <Tab label="Pendentes" />
        <Tab label="Em Preparo" />
        <Tab label="Prontos" />
        <Tab label="Entregues" />
        <Tab label="Cancelados" />
      </Tabs>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Mesa</TableCell>
              <TableCell>Garçom</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              pedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>{pedido.codigo}</TableCell>
                  <TableCell>
                    {pedido.mesa ? `Mesa ${pedido.mesa.numero}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {pedido.garcom ? pedido.garcom.nome : 'N/A'}
                  </TableCell>
                  <TableCell>
                    R$ {parseFloat(pedido.valor_total).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(pedido.status)}
                      color={getStatusColor(pedido.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatarData(pedido.created_at)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/pedidos/${pedido.id}`)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    
                    {pedido.status === 'pendente' && (
                      <>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleStatusChange(pedido.id, 'em_preparo')}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelarPedido(pedido.id)}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    
                    {pedido.status === 'em_preparo' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => handleStatusChange(pedido.id, 'pronto')}
                      >
                        Pronto
                      </Button>
                    )}
                    
                    {pedido.status === 'pronto' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleStatusChange(pedido.id, 'entregue')}
                      >
                        Entregar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Pedidos;
