import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Pedidos from './pages/Pedidos';
import Mesas from './pages/Mesas';
import DetalheMesa from './pages/DetalheMesa';
import NovoPedido from './pages/NovoPedido';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import Financeiro from './pages/Financeiro';
import Cozinha from './pages/Cozinha';

// Componentes
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {currentUser && <Header />}
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/produtos" element={
            <ProtectedRoute>
              <Produtos />
            </ProtectedRoute>
          } />

          <Route path="/pedidos" element={
            <ProtectedRoute>
              <Pedidos />
            </ProtectedRoute>
          } />

          <Route path="/mesas" element={
            <ProtectedRoute>
              <Mesas />
            </ProtectedRoute>
          } />

          <Route path="/mesas/:id" element={
            <ProtectedRoute>
              <DetalheMesa />
            </ProtectedRoute>
          } />

          <Route path="/mesas/:id/pedido" element={
            <ProtectedRoute>
              <NovoPedido />
            </ProtectedRoute>
          } />

          <Route path="/relatorios" element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <Relatorios />
            </ProtectedRoute>
          } />

          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Usuarios />
            </ProtectedRoute>
          } />

          <Route path="/financeiro" element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <Financeiro />
            </ProtectedRoute>
          } />

          <Route path="/cozinha" element={
            <ProtectedRoute allowedRoles={['admin', 'gerente', 'cozinheiro']}>
              <Cozinha />
            </ProtectedRoute>
          } />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
