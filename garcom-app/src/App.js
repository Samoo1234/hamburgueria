import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Páginas
import Login from './pages/Login';
import Mesas from './pages/Mesas';
import DetalheMesa from './pages/DetalheMesa';
import NovoPedido from './pages/NovoPedido';
import Perfil from './pages/Perfil';

// Componentes
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {currentUser && <Header />}
        <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Routes>
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={
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
            
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
