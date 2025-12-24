import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Redirecionar para a página de login se não estiver autenticado
    return <Navigate to="/login" />;
  }
  
  return children;
}

export default ProtectedRoute;
