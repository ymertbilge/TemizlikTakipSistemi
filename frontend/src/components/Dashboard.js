import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
  CardMedia, IconButton, Collapse, List, ListItem, ListItemText, Divider, Alert, Tabs, Tab
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
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activeTab, setActiveTab] = useState(0); // 0: Tümü, 1: Dondurma Temizlik, 2: Taze Dolap Dolum

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

  // Raporları filtrele
  useEffect(() => {
    let filtered = reports;
    
    switch (activeTab) {
      case 0: // Tümü
        filtered = reports;
        break;
      case 1: // Dondurma Temizlik
        filtered = reports.filter(report => 
          !report.reportType || report.reportType === 'iceCream'
        );
        break;
      case 2: // Taze Dolap Dolum
        filtered = reports.filter(report => 
          report.reportType === 'fridge'
        );
        break;
      default:
        filtered = reports;
    }
    
    setFilteredReports(filtered);
  }, [reports, activeTab]);

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

  const getReportTypeText = (reportType) => {
    switch (reportType) {
      case 'fridge': return 'Taze Dolap Dolum';
      case 'iceCream': 
      case undefined: 
      case null: 
        return 'Dondurma Temizlik';
      default: return reportType;
    }
  };

  const getReportTypeColor = (reportType) => {
    switch (reportType) {
      case 'fridge': return 'info';
      case 'iceCream': 
      case undefined: 
      case null: 
        return 'primary';
      default: return 'default';
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
            Dondurma Temizlik
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate('/new-fridge-report')}
            sx={{ minWidth: 200, mr: 2 }}
          >
            Taze Dolap Dolum
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

      {/* Rapor Türü Filtresi - Sadece Routeman için */}
      {userData?.role === 'routeman' && (
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Tüm Raporlar" />
            <Tab label="Dondurma Temizlik" />
            <Tab label="Taze Dolap Dolum" />
          </Tabs>
        </Box>
      )}

      {/* Raporlar Bölümü */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          {userData?.role === 'admin' ? 'Tüm Raporlar' : 'Raporlarım'} ({filteredReports.length})
        </Typography>

        {filteredReports.length === 0 ? (
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
                  <TableCell>Rapor Türü</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
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
                        <Chip
                          label={getReportTypeText(report.reportType)}
                          color={getReportTypeColor(report.reportType)}
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
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
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

                              {/* Checklist Özeti veya Slot Bilgisi */}
                              <Grid item xs={12} md={6}>
                                {report.reportType === 'fridge' ? (
                                  <Card variant="outlined">
                                    <CardContent>
                                      <Typography variant="h6" gutterBottom>
                                        Slot Bilgisi
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Dolu Slot Sayısı:</strong> {report.slots?.filter(slot => slot.commodity).length || 0}/58
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Toplam Ürün Miktarı:</strong> {
                                          report.slots?.reduce((total, slot) => 
                                            total + (parseInt(slot.quantity) || 0), 0
                                          ) || 0
                                        }
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                ) : (
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
                                      {/* Yeni alanlar */}
                                      {report.cupStock !== undefined && (
                                        <Typography variant="body2">
                                          <strong>Bardak Stok:</strong> {report.cupStock}
                                        </Typography>
                                      )}
                                      {report.waste !== undefined && (
                                        <Typography variant="body2">
                                          <strong>Zayi:</strong> {report.waste}
                                        </Typography>
                                      )}
                                      {report.stockInfo !== undefined && (
                                        <Typography variant="body2">
                                          <strong>Yedek/Stok:</strong> {report.stockInfo}
                                        </Typography>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
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

                {/* Checklist Detayları veya Slot Bilgisi */}
                <Grid item xs={12} md={6}>
                  {selectedReport.reportType === 'fridge' ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Slot Bilgisi
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Dolu Slot Sayısı:</strong> {selectedReport.slots?.filter(slot => slot.commodity).length || 0}/58
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Toplam Ürün Miktarı:</strong> {
                          selectedReport.slots?.reduce((total, slot) => 
                            total + (parseInt(slot.quantity) || 0), 0
                          ) || 0
                        }
                      </Typography>
                      <Typography variant="body2">
                        <strong>Detaylı Slot Bilgisi:</strong>
                      </Typography>
                      <List dense>
                        {selectedReport.slots?.slice(0, 10).map((slot, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`Slot ${slot.id}: ${slot.commodity || 'Boş'}`}
                              secondary={`Miktar: ${slot.quantity || 'N/A'} | SKT: ${slot.expiryDate || 'N/A'} | Parti: ${slot.batchNumber || 'N/A'}`}
                            />
                          </ListItem>
                        ))}
                        {selectedReport.slots?.length > 10 && (
                          <ListItem>
                            <ListItemText
                              primary={`... ve ${selectedReport.slots.length - 10} daha fazla slot`}
                            />
                          </ListItem>
                        )}
                      </List>
                    </>
                  ) : (
                    <>
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

                      {/* Yeni alanlar */}
                      {(selectedReport.cupStock !== undefined || 
                        selectedReport.waste !== undefined || 
                        selectedReport.stockInfo !== undefined) && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Ek Bilgiler
                          </Typography>
                          {selectedReport.cupStock !== undefined && (
                            <Typography variant="body2">
                              <strong>Bardak Stok:</strong> {selectedReport.cupStock}
                            </Typography>
                          )}
                          {selectedReport.waste !== undefined && (
                            <Typography variant="body2">
                              <strong>Zayi:</strong> {selectedReport.waste}
                            </Typography>
                          )}
                          {selectedReport.stockInfo !== undefined && (
                            <Typography variant="body2">
                              <strong>Yedek/Stok:</strong> {selectedReport.stockInfo}
                            </Typography>
                          )}
                        </>
                      )}
                    </>
                  )}
                </Grid>

                {/* Dolum Detayları veya Slot Detayları */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedReport.reportType === 'fridge' ? 'Slot Detayları' : 'Dolum Detayları'}
                  </Typography>
                  {selectedReport.reportType === 'fridge' ? (
                    <Grid container spacing={2}>
                      {selectedReport.slots?.map((slot, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>
                                Slot {slot.id}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Ürün:</strong> {slot.commodity || 'Boş'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Miktar:</strong> {slot.quantity || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>SKT:</strong> {slot.expiryDate || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Parti:</strong> {slot.batchNumber || 'N/A'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
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
                  )}
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
