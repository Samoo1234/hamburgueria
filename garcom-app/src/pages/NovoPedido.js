import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Divider, Button, Chip, Grid,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, CircularProgress, Alert, TextField,
  Tabs, Tab, Card, CardContent, CardMedia, CardActionArea,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function NovoPedido() {
  const { id: mesaId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [mesa, setMesa] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [error, setError] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [adicionais, setAdicionais] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Buscar informações da mesa
        const mesaResponse = await api.get(`/api/mesas/${mesaId}`);
        setMesa(mesaResponse.data);

        // Buscar produtos disponíveis
        const produtosResponse = await api.get('/api/produtos', {
          params: { disponivel: true }
        });
        setProdutos(produtosResponse.data);

        // Extrair categorias únicas dos produtos
        const categoriasUnicas = [...new Set(produtosResponse.data.map(p => p.categoria))];
        setCategorias(categoriasUnicas);

        if (categoriasUnicas.length > 0) {
          setCategoriaAtiva(categoriasUnicas[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mesaId]);

  const handleCategoriaChange = (event, newValue) => {
    setCategoriaAtiva(newValue);
  };

  const handleProdutoClick = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidade(1);
    setObservacoes('');
    setAdicionais([]);
    setDialogOpen(true);
  };

  const handleAddToCart = () => {
    const itemCarrinho = {
      id: Date.now().toString(), // ID temporário para o item no carrinho
      produto: produtoSelecionado,
      quantidade,
      observacoes,
      adicionais: adicionais.map(a => ({ nome: a.nome, preco: a.preco })),
      precoUnitario: produtoSelecionado.preco,
      precoTotal: calcularPrecoItem(produtoSelecionado, quantidade, adicionais)
    };

    setCarrinho([...carrinho, itemCarrinho]);
    setDialogOpen(false);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setObservacoes('');
    setAdicionais([]);
  };

  const handleRemoveFromCart = (itemId) => {
    setCarrinho(carrinho.filter(item => item.id !== itemId));
  };

  const handleQuantidadeChange = (valor) => {
    const novaQuantidade = quantidade + valor;
    if (novaQuantidade >= 1) {
      setQuantidade(novaQuantidade);
    }
  };

  const handleAdicionalToggle = (adicional) => {
    const jaExiste = adicionais.some(a => a.nome === adicional.nome);

    if (jaExiste) {
      setAdicionais(adicionais.filter(a => a.nome !== adicional.nome));
    } else {
      setAdicionais([...adicionais, adicional]);
    }
  };

  const calcularPrecoItem = (produto, qtd, adicionaisItem) => {
    const precoBase = produto.preco * qtd;
    const precoAdicionais = adicionaisItem.reduce((total, adicional) => total + adicional.preco, 0) * qtd;
    return precoBase + precoAdicionais;
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + item.precoTotal, 0);
  };

  const handleEnviarPedido = async () => {
    if (carrinho.length === 0) {
      setError('Adicione pelo menos um item ao pedido');
      return;
    }

    try {
      setEnviandoPedido(true);
      setError('');

      const pedidoData = {
        tipo: 'presencial',
        mesa: mesaId,
        itens: carrinho.map(item => ({
          produto: item.produto.id,
          quantidade: item.quantidade,
          observacoes: item.observacoes,
          adicionais: item.adicionais
        })),
        observacoes: ''
      };

      await api.post('/api/pedidos', pedidoData);

      // Atualizar status da mesa se necessário
      if (mesa.status !== 'em_atendimento') {
        await api.patch(`/api/mesas/${mesaId}/status`, {
          status: 'em_atendimento'
        });
      }

      // Redirecionar para a página da mesa
      navigate(`/mesas/${mesaId}`);
    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      setError('Não foi possível enviar o pedido. Tente novamente.');
      setEnviandoPedido(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const produtosFiltrados = produtos.filter(p => p.categoria === categoriaAtiva);

  return (
    <Box sx={{ pb: 7 }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <IconButton edge="start" onClick={() => navigate(`/mesas/${mesaId}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Novo Pedido - Mesa {mesa?.numero}
          </Typography>
        </Box>

        <Tabs
          value={categoriaAtiva}
          onChange={handleCategoriaChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {categorias.map((categoria) => (
            <Tab key={categoria} label={categoria.charAt(0).toUpperCase() + categoria.slice(1)} value={categoria} />
          ))}
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ p: 2 }}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {produtosFiltrados.map((produto) => (
              <Grid item xs={12} sm={6} md={4} key={produto.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea onClick={() => handleProdutoClick(produto)}>
                    {produto.imagem && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={produto.imagem}
                        alt={produto.nome}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {produto.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {produto.descricao}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        R$ {produto.preco.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: '100px' }}>
            <Typography variant="h6" gutterBottom>
              Carrinho
            </Typography>

            {carrinho.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <ShoppingCartIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  Seu carrinho está vazio
                </Typography>
              </Box>
            ) : (
              <List>
                {carrinho.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={item.produto.nome}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {item.quantidade}x R$ {item.produto.preco.toFixed(2)}
                            </Typography>
                            {item.adicionais.length > 0 && (
                              <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                Adicionais: {item.adicionais.map(a => a.nome).join(', ')}
                              </Typography>
                            )}
                            {item.observacoes && (
                              <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                Obs: {item.observacoes}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            R$ {item.precoTotal.toFixed(2)}
                          </Typography>
                          <IconButton edge="end" onClick={() => handleRemoveFromCart(item.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}

                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="h6" align="right">
                    Total: R$ {calcularTotal().toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<SendIcon />}
                  onClick={handleEnviarPedido}
                  disabled={carrinho.length === 0 || enviandoPedido}
                  sx={{ mt: 2 }}
                >
                  {enviandoPedido ? <CircularProgress size={24} /> : 'Enviar Pedido'}
                </Button>
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para adicionar produto ao carrinho */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {produtoSelecionado && (
          <>
            <DialogTitle>{produtoSelecionado.nome}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                {produtoSelecionado.descricao}
              </Typography>

              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                R$ {produtoSelecionado.preco.toFixed(2)}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 3 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>Quantidade:</Typography>
                <IconButton onClick={() => handleQuantidadeChange(-1)} disabled={quantidade <= 1}>
                  <RemoveIcon />
                </IconButton>
                <Typography variant="body1" sx={{ mx: 2 }}>{quantidade}</Typography>
                <IconButton onClick={() => handleQuantidadeChange(1)}>
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Adicionais */}
              {produtoSelecionado.categoria === 'hamburger' && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="body1" gutterBottom>Adicionais:</Typography>
                  <Grid container spacing={1}>
                    {[
                      { nome: 'Queijo Extra', preco: 3 },
                      { nome: 'Bacon', preco: 4 },
                      { nome: 'Cebola Caramelizada', preco: 2.5 },
                      { nome: 'Ovo', preco: 2 }
                    ].map((adicional) => (
                      <Grid item xs={6} key={adicional.nome}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={adicionais.some(a => a.nome === adicional.nome)}
                              onChange={() => handleAdicionalToggle(adicional)}
                            />
                          }
                          label={`${adicional.nome} (+R$ ${adicional.preco.toFixed(2)})`}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <TextField
                label="Observações"
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Sem cebola, molho à parte..."
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Total: R$ {calcularPrecoItem(produtoSelecionado, quantidade, adicionais).toFixed(2)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddToCart} variant="contained" color="primary">
                Adicionar ao Pedido
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default NovoPedido;