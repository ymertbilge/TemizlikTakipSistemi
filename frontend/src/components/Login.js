import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Container,
  Link
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const { userData, loading: authLoading, login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDefaultCredentials, setShowDefaultCredentials] = useState(false);

  // Eğer kullanıcı zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (userData && !authLoading) {
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [userData, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basit validasyon
    if (!email.trim() || !password.trim()) {
      setError('Lütfen email ve şifre alanlarını doldurun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email.toLowerCase().trim(), password);
      
      if (result.success) {
        // AuthContext otomatik olarak handle edecek ve yönlendirme yapacak
        // Burada manuel bir şey yapmamıza gerek yok
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultAdminLogin = () => {
    setEmail('admin@dogusotomat.com');
    setPassword('Dogusotomat.12');
    setError('');
  };

  // Auth loading durumunda
  if (authLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Eğer kullanıcı zaten giriş yapmışsa loading göster
  if (userData) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Yönlendiriliyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Doğuş Otomat
          </Typography>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Temizlik Takip Sistemi
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Adresi"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              type="email"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Giriş Yap'
              )}
            </Button>

            <Typography variant="body2" color="textSecondary" align="center">
              Sadece yetkili kullanıcılar giriş yapabilir
            </Typography>

            {/* Debug/Test için varsayılan admin bilgileri */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setShowDefaultCredentials(!showDefaultCredentials)}
                sx={{ cursor: 'pointer' }}
              >
                {showDefaultCredentials ? 'Test bilgilerini gizle' : 'Test admin bilgilerini göster'}
              </Link>
              
              {showDefaultCredentials && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Varsayılan Admin Hesabı:</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Email: admin@dogusotomat.com
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Şifre: Dogusotomat.12
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleDefaultAdminLogin}
                    sx={{ mt: 1 }}
                  >
                    Bu bilgileri kullan
                  </Button>
                </Alert>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;