import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Assignment, Dashboard, AdminPanelSettings, Person, Logout, ListAlt } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout(); // AuthContext'teki logout fonksiyonunu kullan
      navigate('/login');
    } catch (error) {
      // Hata sessizce handle edildi
    }
    handleMenuClose();
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  if (!userData) return null; // Hide header if not logged in

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Doğuş Otomat Temizlik Takip Sistemi
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {userData.role === 'admin' && (
            <>
              <Button
                color="inherit"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/admin')}
                sx={{ 
                  backgroundColor: location.pathname === '/admin' ? 'rgba(255,255,255,0.1)' : 'transparent' 
                }}
              >
                Admin Panel
              </Button>
              <Button
                color="inherit"
                startIcon={<ListAlt />}
                onClick={() => navigate('/')}
                sx={{ 
                  backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent' 
                }}
              >
                Raporlar
              </Button>
            </>
          )}
          
          {userData.role === 'routeman' && (
            <>
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                onClick={() => navigate('/')}
                sx={{ 
                  backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent' 
                }}
              >
                Ana Sayfa
              </Button>
              <Button
                color="inherit"
                startIcon={<Assignment />}
                onClick={() => navigate('/new-report')}
                sx={{ 
                  backgroundColor: location.pathname === '/new-report' ? 'rgba(255,255,255,0.1)' : 'transparent' 
                }}
              >
                Yeni Rapor
              </Button>
            </>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="inherit">
              {userData.name}
            </Typography>
            <Avatar 
              sx={{ width: 32, height: 32, cursor: 'pointer' }} 
              onClick={handleMenuOpen}
            >
              <Person />
            </Avatar>
          </Box>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleNavigate('/')}>
            <Dashboard sx={{ mr: 1 }} />
            Ana Sayfa
          </MenuItem>
          {userData.role === 'admin' && (
            <MenuItem onClick={() => handleNavigate('/admin')}>
              <AdminPanelSettings sx={{ mr: 1 }} />
              Admin Panel
            </MenuItem>
          )}
          {userData.role === 'routeman' && (
            <MenuItem onClick={() => handleNavigate('/new-report')}>
              <Assignment sx={{ mr: 1 }} />
              Yeni Rapor
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
