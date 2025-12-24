import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Chip, IconButton,
  Button, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TextField
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

  // Estados para criar nova mesa
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [novaMesa, setNovaMesa] = useState({ numero: '', capacidade: 4 });
  const [creating, setCreating] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Verificar se é admin ou gerente
  const userRole = currentUser?.cargo || currentUser?.role;
  const isAdminOrGerente = userRole === 'admin' || userRole === 'gerente';

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

  const criarMesa = async () => {
    if (!novaMesa.numero) {
      setError('Por favor, informe o número da mesa.');
      return;
    }

    try {
      setCreating(true);
      await api.post('/api/mesas', {
        numero: parseInt(novaMesa.numero),
        capacidade: parseInt(novaMesa.capacidade) || 4,
        status: 'livre'
      });

      setCreateDialogOpen(false);
      setNovaMesa({ numero: '', capacidade: 4 });
      setError('');
      fetchMesas();
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      setError(err.response?.data?.mensagem || 'Não foi possível criar a mesa. Tente novamente.');
    } finally {
      setCreating(false);
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
      {/* Cabeçalho com título e botão de adicionar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Mesas</Typography>
        {isAdminOrGerente && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nova Mesa
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
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

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Atendido por: {mesa.garcom.nome}
                      </Typography>
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
            Deseja atender a Mesa {selectedMesa?.numero}? Você será responsável por esta mesa.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmarAtendimento} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para criar nova mesa */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Criar Nova Mesa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Número da Mesa"
            type="number"
            fullWidth
            variant="outlined"
            value={novaMesa.numero}
            onChange={(e) => setNovaMesa({ ...novaMesa, numero: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Capacidade (pessoas)"
            type="number"
            fullWidth
            variant="outlined"
            value={novaMesa.capacidade}
            onChange={(e) => setNovaMesa({ ...novaMesa, capacidade: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={criarMesa}
            variant="contained"
            color="primary"
            disabled={creating}
          >
            {creating ? <CircularProgress size={24} /> : 'Criar Mesa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Mesas;
