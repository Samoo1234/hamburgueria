import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardMedia,
  CardActions, Button, Chip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select,
  Switch, FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentProduto, setCurrentProduto] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    imagem: '',
    ingredientes: '',
    disponivel: true,
    destaque: false
  });
  const [isEditing, setIsEditing] = useState(false);

  const { currentUser } = useAuth();
  const userRole = currentUser?.cargo || currentUser?.role;
  const isAdminOrGerente = userRole === 'admin' || userRole === 'gerente';

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/produtos');
      setProdutos(response.data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Não foi possível carregar os produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (produto = null) => {
    if (produto) {
      setCurrentProduto({
        ...produto,
        ingredientes: produto.ingredientes ? produto.ingredientes.join(', ') : ''
      });
      setIsEditing(true);
    } else {
      setCurrentProduto({
        nome: '',
        descricao: '',
        preco: '',
        categoria: '',
        imagem: '',
        ingredientes: '',
        disponivel: true,
        destaque: false
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setCurrentProduto({
      ...currentProduto,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async () => {
    try {
      const produtoData = {
        ...currentProduto,
        preco: parseFloat(currentProduto.preco),
        ingredientes: currentProduto.ingredientes
          ? currentProduto.ingredientes.split(',').map(item => item.trim())
          : []
      };

      if (isEditing) {
        await api.put(`/api/produtos/${currentProduto.id}`, produtoData);
      } else {
        await api.post('/api/produtos', produtoData);
      }

      fetchProdutos();
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      setError('Erro ao salvar produto. Verifique os dados e tente novamente.');
    }
  };

  const handleToggleDisponibilidade = async (produto) => {
    try {
      await api.patch(`/api/produtos/${produto.id}/disponibilidade`, {
        disponivel: !produto.disponivel
      });
      fetchProdutos();
    } catch (err) {
      console.error('Erro ao atualizar disponibilidade:', err);
      setError('Erro ao atualizar disponibilidade do produto.');
    }
  };

  const handleDelete = async (produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      try {
        await api.delete(`/api/produtos/${produto.id}`);
        fetchProdutos();
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        setError('Erro ao excluir produto.');
      }
    }
  };

  const getCategoriaLabel = (categoria) => {
    const categorias = {
      hamburger: 'Hambúrguer',
      acompanhamento: 'Acompanhamento',
      bebida: 'Bebida',
      sobremesa: 'Sobremesa',
      combo: 'Combo'
    };
    return categorias[categoria] || categoria;
  };

  if (loading && produtos.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Produtos</Typography>

        {isAdminOrGerente && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Produto
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {produtos.map((produto) => (
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {produto.nome}
                  </Typography>

                  <Chip
                    label={produto.disponivel ? 'Disponível' : 'Indisponível'}
                    color={produto.disponivel ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {produto.descricao}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Chip
                    label={getCategoriaLabel(produto.categoria)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />

                  <Typography variant="h6" color="primary">
                    R$ {parseFloat(produto.preco).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>

              {isAdminOrGerente && (
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(produto)}
                  >
                    Editar
                  </Button>

                  <Button
                    size="small"
                    onClick={() => handleToggleDisponibilidade(produto)}
                  >
                    {produto.disponivel ? 'Desativar' : 'Ativar'}
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(produto)}
                  >
                    Excluir
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Diálogo para adicionar/editar produto */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>

        <DialogContent>
          <TextField
            margin="dense"
            name="nome"
            label="Nome"
            fullWidth
            value={currentProduto.nome}
            onChange={handleInputChange}
            required
          />

          <TextField
            margin="dense"
            name="descricao"
            label="Descrição"
            fullWidth
            multiline
            rows={3}
            value={currentProduto.descricao}
            onChange={handleInputChange}
            required
          />

          <TextField
            margin="dense"
            name="preco"
            label="Preço (R$)"
            type="number"
            fullWidth
            value={currentProduto.preco}
            onChange={handleInputChange}
            required
            inputProps={{ step: 0.01, min: 0 }}
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>Categoria</InputLabel>
            <Select
              name="categoria"
              value={currentProduto.categoria}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="hamburger">Hambúrguer</MenuItem>
              <MenuItem value="acompanhamento">Acompanhamento</MenuItem>
              <MenuItem value="bebida">Bebida</MenuItem>
              <MenuItem value="sobremesa">Sobremesa</MenuItem>
              <MenuItem value="combo">Combo</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="imagem"
            label="URL da Imagem"
            fullWidth
            value={currentProduto.imagem}
            onChange={handleInputChange}
          />

          <TextField
            margin="dense"
            name="ingredientes"
            label="Ingredientes (separados por vírgula)"
            fullWidth
            multiline
            rows={2}
            value={currentProduto.ingredientes}
            onChange={handleInputChange}
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  name="disponivel"
                  checked={currentProduto.disponivel}
                  onChange={handleInputChange}
                />
              }
              label="Disponível"
            />

            <FormControlLabel
              control={
                <Switch
                  name="destaque"
                  checked={currentProduto.destaque}
                  onChange={handleInputChange}
                />
              }
              label="Destaque"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Produtos;
