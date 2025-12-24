import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Menu, MenuItem, Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  Receipt as ReceiptIcon,
  TableBar as TableBarIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  ExitToApp as ExitToAppIcon,
  AccountBalance as AccountBalanceIcon,
  SoupKitchen as SoupKitchenIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Verificar permissões baseadas no cargo/role (suporta ambos os campos)
  const userRole = currentUser?.cargo || currentUser?.role;
  const isAdmin = userRole === 'admin';
  const isGerente = userRole === 'gerente';
  const isCozinheiro = userRole === 'cozinheiro';
  const isAdminOrGerente = isAdmin || isGerente;
  const canAccessCozinha = isAdmin || isGerente || isCozinheiro;

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
          onClick={handleMenuOpen}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RestaurantIcon sx={{ mr: 1 }} />
          Hamburgueria
        </Typography>

        {/* Menu para dispositivos móveis */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { navigate('/'); handleMenuClose(); }}>
            <DashboardIcon sx={{ mr: 1 }} /> Dashboard
          </MenuItem>

          <MenuItem onClick={() => { navigate('/pedidos'); handleMenuClose(); }}>
            <ReceiptIcon sx={{ mr: 1 }} /> Pedidos
          </MenuItem>

          <MenuItem onClick={() => { navigate('/mesas'); handleMenuClose(); }}>
            <TableBarIcon sx={{ mr: 1 }} /> Mesas
          </MenuItem>

          <MenuItem onClick={() => { navigate('/produtos'); handleMenuClose(); }}>
            <RestaurantIcon sx={{ mr: 1 }} /> Produtos
          </MenuItem>

          {isAdminOrGerente && (
            <MenuItem onClick={() => { navigate('/relatorios'); handleMenuClose(); }}>
              <AssessmentIcon sx={{ mr: 1 }} /> Relatórios
            </MenuItem>
          )}

          {isAdminOrGerente && (
            <MenuItem onClick={() => { navigate('/financeiro'); handleMenuClose(); }}>
              <AccountBalanceIcon sx={{ mr: 1 }} /> Financeiro
            </MenuItem>
          )}

          {isAdmin && (
            <MenuItem onClick={() => { navigate('/usuarios'); handleMenuClose(); }}>
              <PersonIcon sx={{ mr: 1 }} /> Usuários
            </MenuItem>
          )}

          {canAccessCozinha && (
            <MenuItem onClick={() => { navigate('/cozinha'); handleMenuClose(); }}>
              <SoupKitchenIcon sx={{ mr: 1 }} /> Cozinha
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ExitToAppIcon sx={{ mr: 1 }} /> Sair
          </MenuItem>
        </Menu>

        {/* Botões para desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<DashboardIcon />}
          >
            Dashboard
          </Button>

          <Button
            color="inherit"
            component={RouterLink}
            to="/pedidos"
            startIcon={<ReceiptIcon />}
          >
            Pedidos
          </Button>

          <Button
            color="inherit"
            component={RouterLink}
            to="/mesas"
            startIcon={<TableBarIcon />}
          >
            Mesas
          </Button>

          <Button
            color="inherit"
            component={RouterLink}
            to="/produtos"
            startIcon={<RestaurantIcon />}
          >
            Produtos
          </Button>

          {isAdminOrGerente && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/relatorios"
              startIcon={<AssessmentIcon />}
            >
              Relatórios
            </Button>
          )}

          {isAdminOrGerente && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/financeiro"
              startIcon={<AccountBalanceIcon />}
            >
              Financeiro
            </Button>
          )}

          {isAdmin && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/usuarios"
              startIcon={<PersonIcon />}
            >
              Usuários
            </Button>
          )}

          {canAccessCozinha && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/cozinha"
              startIcon={<SoupKitchenIcon />}
            >
              Cozinha
            </Button>
          )}

          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
          >
            Sair
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
