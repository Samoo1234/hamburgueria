import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  CircularProgress, Alert, Paper
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Receipt as ReceiptIcon,
  TableBar as TableBarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    pedidosHoje: 0,
    mesasOcupadas: 0,
    produtosAtivos: 0,
    faturamentoHoje: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { currentUser } = useAuth();

  useEffect(() => {
    fetchStats();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchStats, 300000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Buscar dados reais do dashboard financeiro
      const response = await api.get('/api/financeiro/dashboard');
      setStats({
        pedidosHoje: response.data.pedidosHoje || 0,
        mesasOcupadas: response.data.mesasOcupadas || 0,
        produtosAtivos: response.data.produtosAtivos || 0,
        faturamentoHoje: response.data.faturamentoHoje || 0
      });

      setError('');
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      // Se falhar, usar dados padrão
      setStats({
        pedidosHoje: 0,
        mesasOcupadas: 0,
        produtosAtivos: 0,
        faturamentoHoje: 0
      });
      setError('Não foi possível carregar as estatísticas. Verifique se as tabelas financeiras foram criadas.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Card de Pedidos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Pedidos Hoje</Typography>
              </Box>
              <Typography variant="h4">{stats.pedidosHoje}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Mesas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TableBarIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Mesas Ocupadas</Typography>
              </Box>
              <Typography variant="h4">{stats.mesasOcupadas}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Produtos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RestaurantIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Produtos Ativos</Typography>
              </Box>
              <Typography variant="h4">{stats.produtosAtivos}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Faturamento */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Faturamento Hoje</Typography>
              </Box>
              <Typography variant="h4">
                R$ {stats.faturamentoHoje.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seção de Pedidos Recentes */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Pedidos Recentes
        </Typography>
        <Typography variant="body1">
          Implementação pendente.
        </Typography>
      </Paper>

      {/* Seção de Mesas Ativas */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Mesas Ativas
        </Typography>
        <Typography variant="body1">
          Implementação pendente.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Dashboard;
