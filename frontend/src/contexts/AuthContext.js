import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inicializar cliente Supabase
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    // Verificar se há um token no localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verificar se o token é válido
      api.defaults.headers.common['x-auth-token'] = token;
      api.get('/api/usuarios/verificar-token')
        .then(response => {
          if (response.data.valido) {
            setCurrentUser(response.data.usuario);
          } else {
            // Token inválido, remover do localStorage
            localStorage.removeItem('authToken');
            api.defaults.headers.common['x-auth-token'] = null;
          }
        })
        .catch(err => {
          console.error('Erro ao verificar token:', err);
          localStorage.removeItem('authToken');
          api.defaults.headers.common['x-auth-token'] = null;
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Login com email e senha
  async function login(email, senha) {
    try {
      setError('');
      const response = await api.post('/api/usuarios/login', { email, senha });
      
      // Armazenar token no localStorage
      localStorage.setItem('authToken', response.data.token);
      
      // Configurar token no cabeçalho para futuras requisições
      api.defaults.headers.common['x-auth-token'] = response.data.token;
      
      setCurrentUser(response.data.usuario);
      return response.data.usuario;
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError(err.response?.data?.mensagem || 'Falha ao fazer login');
      throw err;
    }
  }

  // Logout
  async function logout() {
    try {
      // Remover token do localStorage
      localStorage.removeItem('authToken');
      
      // Remover token do cabeçalho
      api.defaults.headers.common['x-auth-token'] = null;
      
      setCurrentUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError('Falha ao fazer logout');
    }
  }

  const value = {
    currentUser,
    login,
    logout,
    error,
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
