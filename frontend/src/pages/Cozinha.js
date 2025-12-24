import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
    CircularProgress, Alert, Divider, List, ListItem, ListItemText,
    IconButton, Badge
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    Restaurant as RestaurantIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import api from '../services/api';

function Cozinha() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

    const fetchPedidos = useCallback(async () => {
        try {
            const response = await api.get('/api/pedidos');
            // Filtrar apenas pedidos pendentes, em preparo e prontos (não entregues/cancelados)
            const pedidosFiltrados = response.data.filter(p =>
                ['pendente', 'em_preparo', 'pronto'].includes(p.status)
            );
            setPedidos(pedidosFiltrados);
            setUltimaAtualizacao(new Date());
            setError('');
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err);
            setError('Não foi possível carregar os pedidos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPedidos();

        // Atualizar a cada 15 segundos
        const interval = setInterval(fetchPedidos, 15000);

        return () => clearInterval(interval);
    }, [fetchPedidos]);

    const handleStatusChange = async (pedidoId, novoStatus) => {
        try {
            await api.patch(`/api/pedidos/${pedidoId}/status`, {
                status: novoStatus
            });
            fetchPedidos();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            setError('Erro ao atualizar status do pedido.');
        }
    };

    const calcularTempoEspera = (dataString) => {
        const data = new Date(dataString);
        const agora = new Date();
        const diffMs = agora - data;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            return `${diffMins} min`;
        }
        const diffHrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${diffHrs}h ${mins}min`;
    };

    const getTempoColor = (dataString) => {
        const data = new Date(dataString);
        const agora = new Date();
        const diffMins = Math.floor((agora - data) / 60000);

        if (diffMins < 10) return 'success';
        if (diffMins < 20) return 'warning';
        return 'error';
    };

    const pedidosPendentes = pedidos.filter(p => p.status === 'pendente');
    const pedidosEmPreparo = pedidos.filter(p => p.status === 'em_preparo');
    const pedidosProntos = pedidos.filter(p => p.status === 'pronto');

    const renderPedidoCard = (pedido, acoes) => (
        <Card
            key={pedido.id}
            sx={{
                mb: 2,
                boxShadow: 3,
                borderLeft: 4,
                borderColor: pedido.status === 'pendente' ? 'warning.main' :
                    pedido.status === 'em_preparo' ? 'info.main' : 'success.main'
            }}
        >
            <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {pedido.mesa ? `Mesa ${pedido.mesa.numero}` : 'Delivery'}
                    </Typography>
                    <Chip
                        icon={<AccessTimeIcon />}
                        label={calcularTempoEspera(pedido.created_at)}
                        color={getTempoColor(pedido.created_at)}
                        size="small"
                    />
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {pedido.codigo} • {pedido.garcom?.nome || 'N/A'}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <List dense sx={{ py: 0 }}>
                    {pedido.itens?.map((item, index) => (
                        <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {item.quantidade}x {item.produto?.nome || 'Produto'}
                                    </Typography>
                                }
                                secondary={item.observacoes ? (
                                    <Typography variant="caption" color="error.main" sx={{ fontStyle: 'italic' }}>
                                        ⚠️ {item.observacoes}
                                    </Typography>
                                ) : null}
                            />
                        </ListItem>
                    ))}
                </List>

                {pedido.observacoes && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            📝 {pedido.observacoes}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {acoes}
                </Box>
            </CardContent>
        </Card>
    );

    if (loading && pedidos.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <RestaurantIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="h4">Painel da Cozinha</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
                    </Typography>
                    <IconButton onClick={fetchPedidos} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Coluna PENDENTE */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', minHeight: '70vh' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Badge badgeContent={pedidosPendentes.length} color="warning">
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    ⏳ PENDENTE
                                </Typography>
                            </Badge>
                        </Box>

                        {pedidosPendentes.length === 0 ? (
                            <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                                Nenhum pedido pendente
                            </Typography>
                        ) : (
                            pedidosPendentes.map(pedido => renderPedidoCard(pedido, (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => handleStatusChange(pedido.id, 'em_preparo')}
                                >
                                    Iniciar Preparo
                                </Button>
                            )))
                        )}
                    </Paper>
                </Grid>

                {/* Coluna EM PREPARO */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'info.light', minHeight: '70vh' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Badge badgeContent={pedidosEmPreparo.length} color="info">
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    🔥 EM PREPARO
                                </Typography>
                            </Badge>
                        </Box>

                        {pedidosEmPreparo.length === 0 ? (
                            <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                                Nenhum pedido em preparo
                            </Typography>
                        ) : (
                            pedidosEmPreparo.map(pedido => renderPedidoCard(pedido, (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleStatusChange(pedido.id, 'pronto')}
                                >
                                    Marcar Pronto
                                </Button>
                            )))
                        )}
                    </Paper>
                </Grid>

                {/* Coluna PRONTO */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', minHeight: '70vh' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Badge badgeContent={pedidosProntos.length} color="success">
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    ✅ PRONTO
                                </Typography>
                            </Badge>
                        </Box>

                        {pedidosProntos.length === 0 ? (
                            <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                                Nenhum pedido pronto
                            </Typography>
                        ) : (
                            pedidosProntos.map(pedido => renderPedidoCard(pedido, (
                                <Chip
                                    label="Aguardando entrega"
                                    color="success"
                                    variant="outlined"
                                    sx={{ width: '100%' }}
                                />
                            )))
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Cozinha;
