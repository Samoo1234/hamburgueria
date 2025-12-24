import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Grid, TextField, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'garcom',
    ativo: true
  });
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    fetchUsuarios();
  }, []);
  
  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/usuarios');
      setUsuarios(response.data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Não foi possível carregar os usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setCurrentUsuario(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        role: usuario.role,
        ativo: usuario.ativo
      });
    } else {
      setCurrentUsuario(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        role: 'garcom',
        ativo: true
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUsuario(null);
  };
  
  const handleOpenDeleteDialog = (usuario) => {
    setCurrentUsuario(usuario);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrentUsuario(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSwitchChange = (e) => {
    setFormData({
      ...formData,
      ativo: e.target.checked
    });
  };
  
  const handleSubmit = async () => {
    try {
      if (!formData.nome || !formData.email || (!currentUsuario && !formData.senha)) {
        setError('Preencha todos os campos obrigatórios.');
        return;
      }
      
      if (currentUsuario) {
        // Atualizar usuário existente
        const userData = { ...formData };
        if (!userData.senha) {
          delete userData.senha; // Não enviar senha vazia
        }
        
        await api.put(`/api/usuarios/${currentUsuario.id}`, userData);
      } else {
        // Criar novo usuário
        await api.post('/api/usuarios', formData);
      }
      
      fetchUsuarios();
      handleCloseDialog();
      setError('');
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      setError('Não foi possível salvar o usuário. Tente novamente.');
    }
  };
  
  const handleDelete = async () => {
    try {
      await api.delete(`/api/usuarios/${currentUsuario.id}`);
      fetchUsuarios();
      handleCloseDeleteDialog();
      setError('');
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      setError('Não foi possível excluir o usuário. Tente novamente.');
      handleCloseDeleteDialog();
    }
  };
  
  const handleToggleStatus = async (usuario) => {
    try {
      await api.patch(`/api/usuarios/${usuario.id}/status`, {
        ativo: !usuario.ativo
      });
      fetchUsuarios();
      setError('');
    } catch (err) {
      console.error('Erro ao alterar status do usuário:', err);
      setError('Não foi possível alterar o status do usuário. Tente novamente.');
    }
  };
  
  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrador',
      gerente: 'Gerente',
      garcom: 'Garçom',
      cozinheiro: 'Cozinheiro',
      caixa: 'Caixa'
    };
    return roles[role] || role;
  };
  
  if (loading && !usuarios.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Usuários</Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsuarios}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          
          {currentUser && ['admin', 'gerente'].includes(currentUser.role) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Usuário
            </Button>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Função</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{getRoleLabel(usuario.role)}</TableCell>
                    <TableCell>
                      {usuario.ativo ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleToggleStatus(usuario)}
                          disabled={!currentUser || !['admin', 'gerente'].includes(currentUser.role)}
                        >
                          Ativo
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleToggleStatus(usuario)}
                          disabled={!currentUser || !['admin', 'gerente'].includes(currentUser.role)}
                        >
                          Inativo
                        </Button>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {currentUser && ['admin', 'gerente'].includes(currentUser.role) && (
                        <>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(usuario)}
                          >
                            <EditIcon />
                          </IconButton>
                          
                          {currentUser.role === 'admin' && currentUser.id !== usuario.id && (
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(usuario)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Diálogo para adicionar/editar usuário */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentUsuario ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            
            <TextField
              margin="normal"
              fullWidth
              label={currentUsuario ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}
              name="senha"
              type="password"
              required={!currentUsuario}
              value={formData.senha}
              onChange={handleInputChange}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Função</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="Função"
                onChange={handleInputChange}
              >
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="gerente">Gerente</MenuItem>
                <MenuItem value="garcom">Garçom</MenuItem>
                <MenuItem value="cozinheiro">Cozinheiro</MenuItem>
                <MenuItem value="caixa">Caixa</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativo}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label="Usuário Ativo"
              sx={{ mt: 2 }}
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
      
      {/* Diálogo para confirmar exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o usuário {currentUsuario?.nome}?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Usuarios;
