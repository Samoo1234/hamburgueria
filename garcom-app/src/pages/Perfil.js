import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, CircularProgress,
  Alert, Divider, Grid, Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Perfil() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: currentUser?.nome || '',
    email: currentUser?.email || '',
    senha: '',
    confirmarSenha: ''
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos
    if (!formData.nome || !formData.email) {
      setError('Nome e email são obrigatórios');
      return;
    }
    
    // Validar senhas se estiver alterando
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const userData = {
        nome: formData.nome,
        email: formData.email
      };
      
      // Adicionar senha apenas se for fornecida
      if (formData.senha) {
        userData.senha = formData.senha;
      }
      
      await api.put(`/api/usuarios/${currentUser.id}`, userData);
      
      // Atualizar informações no localStorage
      const storedUser = JSON.parse(localStorage.getItem('garcomUser'));
      const updatedUser = {
        ...storedUser,
        nome: formData.nome,
        email: formData.email
      };
      localStorage.setItem('garcomUser', JSON.stringify(updatedUser));
      
      setSuccess('Perfil atualizado com sucesso!');
      
      // Limpar campos de senha
      setFormData({
        ...formData,
        senha: '',
        confirmarSenha: ''
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Meu Perfil
      </Typography>
      
      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{ width: 80, height: 80, bgcolor: 'primary.main', mr: 2 }}
          >
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          
          <Box>
            <Typography variant="h5">
              {currentUser?.nome}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Garçom
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Alterar Senha (deixe em branco para manter a atual)
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nova Senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                name="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Salvar Alterações'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default Perfil;
