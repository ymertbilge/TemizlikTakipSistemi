import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
  CardMedia, IconButton, Collapse, List, ListItem, ListItemText, Divider, Alert, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Tabs, Tab, CircularProgress
} from '@mui/material';
import { 
  Visibility, ExpandMore, ExpandLess, CheckCircle, Cancel, Delete, Download, Edit
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { reportService, userService, authService } from '../services/firebaseService';

const AdminPanel = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  
  // Kullanıcı ekleme formu
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'routeman'
  });

  // Kullanıcı düzenleme formu
  const [editingUser, setEditingUser] = useState(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: 'routeman',
    isActive: true
  });

  // Fonksiyonları önce tanımla
  const fetchReports = useCallback(async () => {
    try {
      const result = await reportService.getAllReports();
      if (result.success) {
        setReports(result.reports || []);
      } else {
        setError('Raporlar yüklenemedi: ' + result.error);
      }
    } catch (error) {
      setError('Raporlar yüklenirken hata oluştu');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const result = await userService.getAllUsers();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        setError('Kullanıcılar yüklenemedi: ' + result.error);
      }
    } catch (error) {
      setError('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect'i sonra kullan
  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchReports();
      fetchUsers();
    }
  }, [fetchReports, fetchUsers, userData]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!newUser.email || !newUser.password || !newUser.name) {
        setError('Lütfen tüm alanları doldurun.');
        return;
      }

      if (newUser.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.');
        return;
      }

      const result = await authService.createUser(
        newUser.email,
        newUser.password,
        {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      );

      if (result.success) {
        setNewUser({
          email: '',
          password: '',
          name: '',
          role: 'routeman'
        });
        setSuccess('Kullanıcı başarıyla oluşturuldu!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Kullanıcı oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      const result = await userService.updateUser(userId, {
        isActive: !currentStatus
      });
      
      if (result.success) {
        fetchUsers();
        setSuccess('Kullanıcı durumu güncellendi!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Kullanıcı durumu güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı düzenleme modal'ını aç
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      role: user.role || 'routeman',
      isActive: user.isActive !== false
    });
    setEditFormOpen(true);
  };

  // Kullanıcı düzenleme formunu kaydet
  const handleSaveUserEdit = async () => {
    try {
      setLoading(true);
      const result = await userService.updateUser(editingUser.id, {
        name: editFormData.name,
        role: editFormData.role,
        isActive: editFormData.isActive,
        updatedAt: new Date().toISOString()
      });
      
      if (result.success) {
        fetchUsers();
        setSuccess('Kullanıcı başarıyla güncellendi!');
        setTimeout(() => setSuccess(''), 3000);
        setEditFormOpen(false);
        setEditingUser(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Kullanıcı güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme modal'ını kapat
  const handleCloseEditForm = () => {
    setEditFormOpen(false);
    setEditingUser(null);
    setEditFormData({
      name: '',
      role: 'routeman',
      isActive: true
    });
  };

  const handleDeleteReport = async (reportId) => {
    try {
      setLoading(true);
      const result = await reportService.deleteReport(reportId);
      
      if (result.success) {
        setSuccess('Rapor başarıyla silindi!');
        fetchReports();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Rapor silinemedi.');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
    }
  };

  const confirmDeleteReport = (report) => {
    setReportToDelete(report);
    setDeleteConfirmOpen(true);
  };

  const handleExportReports = () => {
    try {
      const csvContent = generateCSV(reports);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `raporlar_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Raporlar başarıyla dışa aktarıldı!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Raporlar dışa aktarılamadı: ' + error.message);
    }
  };

  const generateCSV = (reports) => {
    const headers = ['ID', 'Lokasyon', 'Makine Seri No', 'Kullanıcı', 'Tarih', 'Durum', 'Notlar'];
    const rows = reports.map(report => [
      report.id,
      report.location,
      report.machineSerialNumber,
      report.userName,
      report.createdAt ? new Date(report.createdAt).toLocaleDateString('tr-TR') : '',
      report.status,
      report.notes
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const toggleRowExpansion = (reportId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedRows(newExpanded);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Bekliyor';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  if (userData?.role !== 'admin') {
    return (
      <Container>
        <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Bu sayfaya erişim yetkiniz yok.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Admin paneline erişmek için admin yetkisi gereklidir.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Paneli
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Kullanıcı yönetimi ve sistem kontrolü
        </Typography>
      </Box>

      {/* Global Alert Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Raporlar" />
          <Tab label="Kullanıcı Ekle" />
          <Tab label="Kullanıcı Listesi" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Tüm Raporlar ({reports.length})
              </Typography>
              <Button
                variant="contained"
                onClick={handleExportReports}
                disabled={reports.length === 0 || loading}
                startIcon={<Download />}
              >
                CSV Olarak Dışa Aktar
              </Button>
            </Box>

            {reports.length === 0 ? (
              <Alert severity="info">Henüz rapor bulunmuyor.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rapor ID</TableCell>
                      <TableCell>Lokasyon</TableCell>
                      <TableCell>Makine Seri No</TableCell>
                      <TableCell>Kullanıcı</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <React.Fragment key={report.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              onClick={() => toggleRowExpansion(report.id)}
                              startIcon={expandedRows.has(report.id) ? <ExpandLess /> : <ExpandMore />}
                              size="small"
                            >
                              {report.id}
                            </Button>
                          </TableCell>
                          <TableCell>{report.location}</TableCell>
                          <TableCell>{report.machineSerialNumber}</TableCell>
                          <TableCell>{report.userName || 'Bilinmiyor'}</TableCell>
                          <TableCell>{formatDate(report.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(report.status)}
                              color={getStatusColor(report.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                onClick={() => handleViewReport(report)}
                                color="primary"
                                size="small"
                                title="Görüntüle"
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                onClick={() => confirmDeleteReport(report)}
                                color="error"
                                size="small"
                                title="Sil"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={expandedRows.has(report.id)} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1 }}>
                                <Grid container spacing={2}>
                                  {/* Temel Bilgiler */}
                                  <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                      <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                          Temel Bilgiler
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Notlar:</strong> {report.notes || 'Not bulunmuyor'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Oluşturulma:</strong> {formatDate(report.createdAt)}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Güncellenme:</strong> {formatDate(report.updatedAt)}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </Grid>

                                  {/* Checklist Özeti */}
                                  <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                      <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                          Checklist Özeti
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Ekipman:</strong> {report.equipmentChecklist?.filter(item => item.completed).length || 0}/{report.equipmentChecklist?.length || 0}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Temizlik:</strong> {report.cleaningChecklist?.filter(item => item.completed).length || 0}/{report.cleaningChecklist?.length || 0}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </Grid>

                                  {/* Fotoğraflar */}
                                  <Grid item xs={12}>
                                    <Card variant="outlined">
                                      <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                          Fotoğraflar
                                        </Typography>
                                        <Grid container spacing={2}>
                                          {/* Öncesi Fotoğraflar */}
                                          {report.beforePhotos && report.beforePhotos.length > 0 && (
                                            <Grid item xs={12} md={4}>
                                              <Typography variant="subtitle2" gutterBottom>
                                                Öncesi ({report.beforePhotos.length})
                                              </Typography>
                                              <Grid container spacing={1}>
                                                {report.beforePhotos.map((photo, index) => (
                                                  <Grid item xs={6} key={index}>
                                                    <CardMedia
                                                      component="img"
                                                      height="120"
                                                      image={photo}
                                                      alt={`Öncesi ${index + 1}`}
                                                      sx={{ objectFit: 'cover', borderRadius: 1 }}
                                                    />
                                                  </Grid>
                                                ))}
                                              </Grid>
                                            </Grid>
                                          )}

                                          {/* Sonrası Fotoğraflar */}
                                          {report.afterPhotos && report.afterPhotos.length > 0 && (
                                            <Grid item xs={12} md={4}>
                                              <Typography variant="subtitle2" gutterBottom>
                                                Sonrası ({report.afterPhotos.length})
                                              </Typography>
                                              <Grid container spacing={1}>
                                                {report.afterPhotos.map((photo, index) => (
                                                  <Grid item xs={6} key={index}>
                                                    <CardMedia
                                                      component="img"
                                                      height="120"
                                                      image={photo}
                                                      alt={`Sonrası ${index + 1}`}
                                                      sx={{ objectFit: 'cover', borderRadius: 1 }}
                                                    />
                                                  </Grid>
                                                ))}
                                              </Grid>
                                            </Grid>
                                          )}

                                          {/* Sorun Fotoğrafları */}
                                          {report.issuePhotos && report.issuePhotos.length > 0 && (
                                            <Grid item xs={12} md={4}>
                                              <Typography variant="subtitle2" gutterBottom>
                                                Sorun ({report.issuePhotos.length})
                                              </Typography>
                                              <Grid container spacing={1}>
                                                {report.issuePhotos.map((photo, index) => (
                                                  <Grid item xs={6} key={index}>
                                                    <CardMedia
                                                      component="img"
                                                      height="120"
                                                      image={photo}
                                                      alt={`Sorun ${index + 1}`}
                                                      sx={{ objectFit: 'cover', borderRadius: 1 }}
                                                    />
                                                  </Grid>
                                                ))}
                                              </Grid>
                                            </Grid>
                                          )}

                                          {(!report.beforePhotos || report.beforePhotos.length === 0) &&
                                           (!report.afterPhotos || report.afterPhotos.length === 0) &&
                                           (!report.issuePhotos || report.issuePhotos.length === 0) && (
                                            <Grid item xs={12}>
                                              <Alert severity="info">Bu raporda fotoğraf bulunmuyor.</Alert>
                                            </Grid>
                                          )}
                                        </Grid>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Yeni Kullanıcı Ekle
            </Typography>

            <Box component="form" onSubmit={handleCreateUser} sx={{ maxWidth: 500 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Adresi"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                disabled={loading}
                helperText="Geçerli bir email adresi girin"
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Şifre"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                disabled={loading}
                helperText="En az 6 karakter olmalıdır"
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Ad Soyad"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Kullanıcının tam adını girin"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={newUser.role}
                  label="Rol"
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="routeman">Operasyon Sorumlusu</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading || !newUser.email || !newUser.password || !newUser.name}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Oluşturuluyor...
                  </>
                ) : (
                  'Kullanıcı Oluştur'
                )}
              </Button>
            </Box>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Listesi ({users.length})
            </Typography>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ad Soyad</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Oluşturulma</TableCell>
                    <TableCell>Son Giriş</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: user.role === 'admin' ? 'primary.main' : 'text.primary',
                            fontWeight: user.role === 'admin' ? 'bold' : 'normal'
                          }}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Operasyon Sorumlusu'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.isActive}
                              onChange={() => toggleUserStatus(user.id, user.isActive)}
                              color="primary"
                              disabled={loading}
                            />
                          }
                          label={user.isActive ? 'Aktif' : 'Pasif'}
                        />
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? 
                          new Date(user.createdAt).toLocaleDateString('tr-TR') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? 
                          new Date(user.lastLogin).toLocaleDateString('tr-TR') : 
                          'Hiç giriş yapmamış'
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditUser(user)}
                            disabled={loading}
                            startIcon={<Edit />}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            disabled={loading}
                          >
                            {user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary">
                          Henüz kullanıcı bulunmuyor
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Rapor Detay Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Rapor Detayı: {selectedReport?.title}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Temel Bilgiler */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Temel Bilgiler
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Lokasyon"
                        secondary={selectedReport.location}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Makine Seri No"
                        secondary={selectedReport.machineSerialNumber}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Kullanıcı"
                        secondary={selectedReport.userName || 'Bilinmiyor'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Notlar"
                        secondary={selectedReport.notes || 'Not bulunmuyor'}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {/* Checklist Detayları */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Checklist Detayları
                  </Typography>
                  
                  {/* Ekipman Checklist */}
                  <Typography variant="subtitle2" gutterBottom>
                    Ekipman Kontrolü
                  </Typography>
                  <List dense>
                    {selectedReport.equipmentChecklist?.map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText
                          primary={item.text}
                          secondary={item.completed ? `Tamamlandı: ${formatDate(item.completedAt)}` : 'Tamamlanmadı'}
                        />
                        {item.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  {/* Temizlik Checklist */}
                  <Typography variant="subtitle2" gutterBottom>
                    Temizlik Kontrolü
                  </Typography>
                  <List dense>
                    {selectedReport.cleaningChecklist?.map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText
                          primary={item.text}
                          secondary={item.completed ? `Tamamlandı: ${formatDate(item.completedAt)}` : 'Tamamlanmadı'}
                        />
                        {item.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                {/* Dolum Detayları */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Dolum Detayları
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Dondurma Bazı */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Dondurma Bazı
                          </Typography>
                          <Typography variant="body2">
                            Miktar: {selectedReport.fillingDetails?.iceCreamBase?.amount || '0'} {selectedReport.fillingDetails?.iceCreamBase?.unit || ''}
                          </Typography>
                          <Typography variant="body2">
                            Tip: {selectedReport.fillingDetails?.iceCreamBase?.unitType || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Süslemeler */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Süslemeler ({selectedReport.fillingDetails?.toppings?.length || 0})
                          </Typography>
                          {selectedReport.fillingDetails?.toppings?.map((topping, index) => (
                            <Typography key={index} variant="body2">
                              {topping.name} ({topping.brand}) - {topping.amount} {topping.unit}
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Soslar */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Soslar ({selectedReport.fillingDetails?.sauces?.length || 0})
                          </Typography>
                          {selectedReport.fillingDetails?.sauces?.map((sauce, index) => (
                            <Typography key={index} variant="body2">
                              {sauce.name} ({sauce.brand}) - {sauce.amount} {sauce.unit}
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Fotoğraflar */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Fotoğraflar
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Öncesi Fotoğraflar */}
                    {selectedReport.beforePhotos && selectedReport.beforePhotos.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Öncesi Fotoğraflar ({selectedReport.beforePhotos.length})
                        </Typography>
                        <Grid container spacing={1}>
                          {selectedReport.beforePhotos.map((photo, index) => (
                            <Grid item xs={12} key={index}>
                              <CardMedia
                                component="img"
                                height="200"
                                image={photo}
                                alt={`Öncesi ${index + 1}`}
                                sx={{ objectFit: 'cover', borderRadius: 1 }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    )}

                    {/* Sonrası Fotoğraflar */}
                    {selectedReport.afterPhotos && selectedReport.afterPhotos.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Sonrası Fotoğraflar ({selectedReport.afterPhotos.length})
                        </Typography>
                        <Grid container spacing={1}>
                          {selectedReport.afterPhotos.map((photo, index) => (
                            <Grid item xs={12} key={index}>
                              <CardMedia
                                component="img"
                                height="200"
                                image={photo}
                                alt={`Sonrası ${index + 1}`}
                                sx={{ objectFit: 'cover', borderRadius: 1 }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    )}

                    {/* Sorun Fotoğrafları */}
                    {selectedReport.issuePhotos && selectedReport.issuePhotos.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Sorun Fotoğrafları ({selectedReport.issuePhotos.length})
                        </Typography>
                        <Grid container spacing={1}>
                          {selectedReport.issuePhotos.map((photo, index) => (
                            <Grid item xs={12} key={index}>
                              <CardMedia
                                component="img"
                                height="200"
                                image={photo}
                                alt={`Sorun ${index + 1}`}
                                sx={{ objectFit: 'cover', borderRadius: 1 }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    )}

                    {(!selectedReport.beforePhotos || selectedReport.beforePhotos.length === 0) &&
                     (!selectedReport.afterPhotos || selectedReport.afterPhotos.length === 0) &&
                     (!selectedReport.issuePhotos || selectedReport.issuePhotos.length === 0) && (
                      <Grid item xs={12}>
                        <Alert severity="info">Bu raporda fotoğraf bulunmuyor.</Alert>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rapor Silme Onay Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Rapor Silme Onayı
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bu raporu silmek istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Rapor ID:</strong> {reportToDelete?.id}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Lokasyon:</strong> {reportToDelete?.location}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Makine Seri No:</strong> {reportToDelete?.machineSerialNumber}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Bu işlem geri alınamaz! Rapor ve tüm fotoğrafları kalıcı olarak silinecektir.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={() => handleDeleteReport(reportToDelete?.id)} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Siliniyor...' : 'Evet, Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kullanıcı Düzenleme Dialog */}
      <Dialog
        open={editFormOpen}
        onClose={handleCloseEditForm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Kullanıcı Düzenle: {editingUser?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Ad Soyad"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={editFormData.role}
                label="Rol"
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="routeman">Operasyon Sorumlusu</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Kullanıcı Aktif"
              sx={{ mb: 2 }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Email:</strong> {editingUser?.email}
              </Typography>
              <Typography variant="body2">
                <strong>Oluşturulma:</strong> {editingUser?.createdAt ? 
                  new Date(editingUser.createdAt).toLocaleDateString('tr-TR') : 'N/A'
                }
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditForm}>
            İptal
          </Button>
          <Button 
            onClick={handleSaveUserEdit} 
            color="primary" 
            variant="contained"
            disabled={loading || !editFormData.name.trim()}
          >
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;