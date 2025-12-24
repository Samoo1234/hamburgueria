import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Chip, IconButton,
  Button, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  RestaurantMenu as RestaurantMenuIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Add as AddIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMesas();

    // Configurar atualização periódica
    const interval = setInterval(fetchMesas, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const fetchMesas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/mesas');
      setMesas(response.data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      setError('Não foi possível carregar as mesas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMesaClick = (mesa) => {
    navigate(`/mesas/${mesa.id}`);
  };

  const handleAtenderMesa = (mesa, event) => {
    event.stopPropagation();
    setSelectedMesa(mesa);
    setDialogOpen(true);
  };

  const confirmarAtendimento = async () => {
    try {
      // Atualizar status da mesa para em_atendimento e associar o garçom
      await api.patch(`/api/mesas/${selectedMesa.id}/status`, {
        status: 'em_atendimento',
        garcomId: currentUser.id
      });

      fetchMesas();
      setDialogOpen(false);
      navigate(`/mesas/${selectedMesa.id}`);
    } catch (err) {
      console.error('Erro ao atender mesa:', err);
      setError('Não foi possível atender a mesa. Tente novamente.');
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

  const isMinhasMesas = (mesa) => {
    return mesa.garcom && mesa.garcom.id === currentUser.id;
  };

  const mesasAgrupadas = {
    minhasMesas: mesas.filter(isMinhasMesas),
    aguardandoAtendimento: mesas.filter(m => m.status === 'aguardando_atendimento' && !isMinhasMesas(m)),
    outras: mesas.filter(m => m.status !== 'aguardando_atendimento' && !isMinhasMesas(m))
  };

  if (loading && mesas.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mesasAgrupadas.minhasMesas.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Minhas Mesas
          </Typography>
          <Grid container spacing={2}>
            {mesasAgrupadas.minhasMesas.map((mesa) => (
              <Grid item xs={12} sm={6} md={4} key={mesa.id}>
                <Card
                  onClick={() => handleMesaClick(mesa)}
                  sx={{
                    cursor: 'pointer',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 },
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Mesa {mesa.numero}</Typography>
                      <Chip
                        label={getStatusText(mesa.status)}
                        color={getStatusColor(mesa.status)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Capacidade: {mesa.capacidade} pessoas</Typography>
                    </Box>

                    {mesa.chamandoGarcom && (
                      <Chip
                        label="Chamando Garçom"
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<RestaurantMenuIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mesas/${mesa.id}/pedido`);
                        }}
                      >
                        Fazer Pedido
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {mesasAgrupadas.aguardandoAtendimento.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Aguardando Atendimento
          </Typography>
          <Grid container spacing={2}>
            {mesasAgrupadas.aguardandoAtendimento.map((mesa) => (
              <Grid item xs={12} sm={6} md={4} key={mesa.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 },
                    borderLeft: '4px solid',
                    borderColor: 'error.main',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Mesa {mesa.numero}</Typography>
                      <Chip
                        label={getStatusText(mesa.status)}
                        color={getStatusColor(mesa.status)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Capacidade: {mesa.capacidade} pessoas</Typography>
                    </Box>

                    {mesa.chamandoGarcom && (
                      <Chip
                        label="Chamando Garçom"
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={(e) => handleAtenderMesa(mesa, e)}
                      >
                        Atender Mesa
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box>
        <Typography variant="h5" gutterBottom>
          Todas as Mesas
        </Typography>
        <Grid container spacing={2}>
          {mesasAgrupadas.outras.map((mesa) => (
            <Grid item xs={12} sm={6} md={4} key={mesa.id}>
              <Card
                onClick={() => handleMesaClick(mesa)}
                sx={{
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">Mesa {mesa.numero}</Typography>
                    <Chip
                      label={getStatusText(mesa.status)}
                      color={getStatusColor(mesa.status)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">Capacidade: {mesa.capacidade} pessoas</Typography>
                  </Box>

                  {mesa.garcom && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Garçom: {mesa.garcom.nome}
                    </Typography>
                  )}

                  {mesa.status === 'livre' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={(e) => handleAtenderMesa(mesa, e)}
                      >
                        Ocupar Mesa
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Confirmar Atendimento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deseja atender a Mesa {selectedMesa?.numero}? Você será responsável pelo atendimento desta mesa.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmarAtendimento} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Mesas;