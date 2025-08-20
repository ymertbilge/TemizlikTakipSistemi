import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
  CardMedia, IconButton, Collapse, List, ListItem, ListItemText, Divider, Alert
} from '@mui/material';
import { 
  Visibility, ExpandMore, ExpandLess,CheckCircle, Cancel,
  Assignment, Add, Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fonksiyonları önce tanımla
  const fetchReports = useCallback(async () => {
    try {
      // userData kontrolü
      if (!userData) {
        return;
      }
      
      if (userData?.role === 'routeman') {
        // Routeman sadece kendi raporlarını görebilir
        if (!userData.uid) {
          setError('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }
        const result = await reportService.getUserReports(userData.uid);
        if (result.success) {
          setReports(result.reports || []);
        } else {
          setError('Raporlar yüklenemedi: ' + result.error);
        }
      } else if (userData?.role === 'admin') {
        // Admin tüm raporları görebilir
        const result = await reportService.getAllReports();
        if (result.success) {
          setReports(result.reports || []);
        } else {
          setError('Raporlar yüklenemedi: ' + result.error);
        }
      } else {
        setError('Bilinmeyen kullanıcı rolü');
      }
    } catch (error) {
      setError('Raporlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // useEffect'i sonra kullan
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Component mount olduğunda ve URL değişikliklerinde raporları yenile
  useEffect(() => {
    // Component mount olduğunda raporları yükle
    fetchReports();

    // Her 5 saniyede bir raporları yenile (yeni raporlar için)
    const interval = setInterval(() => {
      fetchReports();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchReports]);

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

  if (loading && reports.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          {userData?.role === 'admin' ? 'Admin Paneli' : 'Routeman Paneli'}
        </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Yeni Rapor Oluştur Butonu - Sadece Routeman için */}
      {userData?.role === 'routeman' && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate('/new-report')}
            sx={{ minWidth: 200, mr: 2 }}
          >
            Yeni Rapor Oluştur
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Refresh />}
            onClick={fetchReports}
            disabled={loading}
            sx={{ minWidth: 150 }}
          >
            Yenile
          </Button>
        </Box>
      )}

      {/* Raporlar Bölümü */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          {userData?.role === 'admin' ? 'Tüm Raporlar' : 'Raporlarım'} ({reports.length})
        </Typography>

        {reports.length === 0 ? (
          <Alert severity="info">
            {userData?.role === 'admin' ? 'Henüz rapor bulunmuyor.' : 'Henüz rapor oluşturmadınız.'}
          </Alert>
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
                        <IconButton
                          onClick={() => handleViewReport(report)}
                          color="primary"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
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
    </Container>
  );
};

export default Dashboard;
