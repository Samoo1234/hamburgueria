import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase, { signIn, signOut } from '../services/supabase';
import api from '../services/api';

const SupabaseAuthContext = createContext();

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext);
}

export function SupabaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar a sessão atual do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Buscar dados adicionais do usuário
          const { data: userData, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && userData) {
            // Verificar se o usuário é um garçom
            if (userData.cargo !== 'garcom') {
              setError('Acesso permitido apenas para garçons');
              await signOut();
              return;
            }

            // Criar objeto de usuário compatível com o formato atual
            const user = {
              id: userData.id,
              nome: userData.nome,
              email: session.user.email,
              cargo: userData.cargo
            };

            // Salvar no localStorage para compatibilidade
            localStorage.setItem('garcomUser', JSON.stringify(user));
            localStorage.setItem('garcomToken', session.access_token);
            
            // Configurar o token para o axios
            api.defaults.headers.common['x-auth-token'] = session.access_token;
            
            setCurrentUser(user);
          }
        } else {
          // Limpar dados do usuário
          setCurrentUser(null);
          localStorage.removeItem('garcomUser');
          localStorage.removeItem('garcomToken');
          delete api.defaults.headers.common['x-auth-token'];
        }
        
        setLoading(false);
      }
    );

    // Verificar se há um usuário logado no localStorage (para compatibilidade)
    const storedUser = localStorage.getItem('garcomUser');
    const token = localStorage.getItem('garcomToken');
    
    if (storedUser && token && !currentUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      api.defaults.headers.common['x-auth-token'] = token;
    }
    
    setLoading(false);

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, senha) => {
    try {
      setError('');
      
      // Login com Supabase
      const { session, error } = await signIn(email, senha);
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    error
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {!loading && children}
    </SupabaseAuthContext.Provider>
  );
}