import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Grid, TextField, Divider,
  List, ListItem, ListItemText, IconButton, CircularProgress,
  Alert, Tabs, Tab, Card, CardContent, CardMedia, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function NovoPedido() {
  const [mesa, setMesa] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [itensPedido, setItensPedido] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemObservacoes, setItemObservacoes] = useState('');
  const [itemQuantidade, setItemQuantidade] = useState(1);
  
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchMesaEProdutos();
  }, [id]);
  
  const fetchMesaEProdutos = async () => {
    try {
      setLoading(true);
      
      // Buscar mesa
      const mesaResponse = await api.get(`/api/mesas/${id}`);
      setMesa(mesaResponse.data);
      
      // Buscar produtos
      const produtosResponse = await api.get('/api/produtos');
      const produtosDisponiveis = produtosResponse.data.filter(p => p.disponivel);
      setProdutos(produtosDisponiveis);
      
      // Extrair categorias únicas
      const categoriasUnicas = [...new Set(produtosDisponiveis.map(p => p.categoria))];
      setCategorias(categoriasUnicas);
      
      setError('');
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleAddItem = (produto) => {
    setCurrentItem(produto);
    setItemQuantidade(1);
    setItemObservacoes('');
    setDialogOpen(true);
  };
  
  const handleConfirmAddItem = () => {
    const novoItem = {
      id: Date.now(), // ID temporário
      produto: currentItem,
      produto_id: currentItem.id,
      quantidade: itemQuantidade,
      preco_unitario: currentItem.preco,
      observacoes: itemObservacoes,
      subtotal: currentItem.preco * itemQuantidade
    };
    
    setItensPedido([...itensPedido, novoItem]);
    setDialogOpen(false);
  };
  
  const handleRemoveItem = (itemId) => {
    setItensPedido(itensPedido.filter(item => item.id !== itemId));
  };
  
  const handleUpdateQuantidade = (itemId, delta) => {
    setItensPedido(itensPedido.map(item => {
      if (item.id === itemId) {
        const novaQuantidade = Math.max(1, item.quantidade + delta);
        return {
          ...item,
          quantidade: novaQuantidade,
          subtotal: item.preco_unitario * novaQuantidade
        };
      }
      return item;
    }));
  };
  
  const handleSalvarPedido = async () => {
    if (itensPedido.length === 0) {
      setError('Adicione pelo menos um item ao pedido');
      return;
    }
    
    try {
      const pedidoData = {
        mesa_id: id,
        garcom_id: currentUser.id,
        itens: itensPedido.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          observacoes: item.observacoes
        })),
        observacoes
      };
      
      await api.post('/api/pedidos', pedidoData);
      
      // Atualizar status da mesa se necessário
      if (mesa.status === 'livre' || mesa.status === 'reservada') {
        await api.patch(`/api/mesas/${id}/status`, {
          status: 'ocupada',
          garcomId: currentUser.id
        });
      }
      
      navigate(`/mesas/${id}`);
    } catch (err) {
      console.error('Erro ao salvar pedido:', err);
      setError('Não foi possível salvar o pedido. Tente novamente.');
    }
  };
  
  const calcularTotal = () => {
    return itensPedido.reduce((total, item) => total + item.subtotal, 0);
  };
  
  const getCategoriaLabel = (categoria) => {
    const categorias = {
      hamburger: 'Hambúrgueres',
      acompanhamento: 'Acompanhamentos',
      bebida: 'Bebidas',
      sobremesa: 'Sobremesas',
      combo: 'Combos'
    };
    return categorias[categoria] || categoria;
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
          onClick={() => navigate(`/mesas/${id}`)}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        
        <Typography variant="h4">Novo Pedido - Mesa {mesa.numero}</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab label="Todos" />
              {categorias.map((categoria, index) => (
                <Tab key={categoria} label={getCategoriaLabel(categoria)} />
              ))}
            </Tabs>
            
            <Grid container spacing={2}>
              {produtos
                .filter(produto => tabValue === 0 || produto.categoria === categorias[tabValue - 1])
                .map((produto) => (
                  <Grid item xs={12} sm={6} md={4} key={produto.id}>
                    <Card>
                      {produto.imagem && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={produto.imagem}
                          alt={produto.nome}
                        />
                      )}
                      
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {produto.nome}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {produto.descricao}
                        </Typography>
                        
                        <Typography variant="h6" color="primary">
                          R$ {parseFloat(produto.preco).toFixed(2)}
                        </Typography>
                      </CardContent>
                      
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddItem(produto)}
                        >
                          Adicionar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Itens do Pedido
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {itensPedido.length === 0 ? (
              <Typography variant="body1" sx={{ mb: 2 }}>
                Nenhum item adicionado ao pedido.
              </Typography>
            ) : (
              <List>
                {itensPedido.map((item) => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{ mb: 2, p: 1 }}
                  >
                    <ListItem
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={item.produto.nome}
                        secondary={`R$ ${parseFloat(item.preco_unitario).toFixed(2)}`}
                      />
                    </ListItem>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mb: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantidade(item.id, -1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      
                      <Typography sx={{ mx: 1 }}>
                        {item.quantidade}
                      </Typography>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantidade(item.id, 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      
                      <Typography sx={{ ml: 2 }}>
                        R$ {item.subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    {item.observacoes && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
                        Obs: {item.observacoes}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </List>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <TextField
              label="Observações do Pedido"
              multiline
              rows={3}
              fullWidth
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Total
              </Typography>
              <Typography variant="h6" color="primary">
                R$ {calcularTotal().toFixed(2)}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSalvarPedido}
              disabled={itensPedido.length === 0}
            >
              Salvar Pedido
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Diálogo para adicionar item */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Adicionar Item</DialogTitle>
        <DialogContent>
          {currentItem && (
            <>
              <Typography variant="h6">{currentItem.nome}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {currentItem.descricao}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ mr: 2 }}>Quantidade:</Typography>
                <IconButton
                  size="small"
                  onClick={() => setItemQuantidade(Math.max(1, itemQuantidade - 1))}
                >
                  <RemoveIcon />
                </IconButton>
                
                <TextField
                  value={itemQuantidade}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setItemQuantidade(value);
                    }
                  }}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                  sx={{ width: 60, mx: 1 }}
                />
                
                <IconButton
                  size="small"
                  onClick={() => setItemQuantidade(itemQuantidade + 1)}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <TextField
                label="Observações"
                multiline
                rows={3}
                fullWidth
                value={itemObservacoes}
                onChange={(e) => setItemObservacoes(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Total: R$ {(currentItem.preco * itemQuantidade).toFixed(2)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAddItem} variant="contained" color="primary">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NovoPedido;
