import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser } = useAuth();

  // Verificar se o usuário está autenticado
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Verificar se há restrição de cargo (suporta tanto 'cargo' quanto 'role')
  const userRole = currentUser.cargo || currentUser.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirecionar para a página inicial se o usuário não tiver permissão
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;

