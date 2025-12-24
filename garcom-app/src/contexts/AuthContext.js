import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const storedUser = localStorage.getItem('garcomUser');
    const token = localStorage.getItem('garcomToken');
    
    if (storedUser && token) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      
      // Configurar o token para todas as requisições
      api.defaults.headers.common['x-auth-token'] = token;
    }
    
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      setError('');
      
      const response = await api.post('/api/usuarios/login', { email, senha });
      const { token, usuario } = response.data;
      
      // Verificar se o usuário é um garçom
      if (usuario.role !== 'garcom') {
        setError('Acesso permitido apenas para garçons');
        return false;
      }
      
      // Salvar usuário e token no localStorage
      localStorage.setItem('garcomUser', JSON.stringify(usuario));
      localStorage.setItem('garcomToken', token);
      
      // Configurar o token para todas as requisições
      api.defaults.headers.common['x-auth-token'] = token;
      
      setCurrentUser(usuario);
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.mensagem || 'Erro ao fazer login. Tente novamente.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('garcomUser');
    localStorage.removeItem('garcomToken');
    delete api.defaults.headers.common['x-auth-token'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}