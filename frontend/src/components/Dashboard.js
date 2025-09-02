import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
  CardMedia, IconButton, Collapse, List, ListItem, ListItemText, Divider, Alert, Tabs, Tab,
  TablePagination
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
  
  // Sayfalama durumu
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sıralama durumu
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

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
    setPage(0); // Tab değiştiğinde sayfa numarasını sıfırla
    setSortConfig({ key: 'createdAt', direction: 'desc' }); // Varsayılan sıralamaya dön
  }, [reports, activeTab]);

  // Sayfalama fonksiyonları
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sıralama fonksiyonu
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filtrelenmiş ve sıralanmış raporları hesapla
  const sortedAndFilteredReports = [...filteredReports].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortConfig.key) {
      case 'createdAt':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      case 'location':
        aValue = (a.location || '').toLowerCase();
        bValue = (b.location || '').toLowerCase();
        break;
      case 'machineSerialNumber':
        aValue = (a.machineSerialNumber || '').toLowerCase();
        bValue = (b.machineSerialNumber || '').toLowerCase();
        break;
      case 'userName':
        aValue = (a.userName || '').toLowerCase();
        bValue = (b.userName || '').toLowerCase();
        break;
      case 'status':
        aValue = (a.status || '').toLowerCase();
        bValue = (b.status || '').toLowerCase();
        break;
      case 'reportType':
        aValue = getReportTypeText(a.reportType).toLowerCase();
        bValue = getReportTypeText(b.reportType).toLowerCase();
        break;
      default:
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Sayfalanmış raporları hesapla
  const paginatedReports = sortedAndFilteredReports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

    return () => clearInterval(interval);
  }, [fetchReports]);

  // Rapor detayını görüntüle
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  // Satır genişletme/daraltma
  const toggleRowExpansion = (reportId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(reportId)) {
      newExpandedRows.delete(reportId);
    } else {
      newExpandedRows.add(reportId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Rapor durumu için renk ve metin
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'primary';
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
      case 'fridge': return 'success';
      case 'iceCream': 
      case undefined: 
      case null: 
        return 'secondary';
      default: return 'default';
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR');
    } catch (error) {
      return 'Geçersiz Tarih';
    }
  };

  if (loading && reports.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography variant="h6">
            Raporlar yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/new-report')}
          >
            Yeni Dondurma Raporu
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/new-fridge-report')}
          >
            Yeni Taze Dolap Raporu
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchReports}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`Tümü (${reports.length})`} />
            <Tab label={`Dondurma Temizlik (${reports.filter(r => !r.reportType || r.reportType === 'iceCream').length})`} />
            <Tab label={`Taze Dolap Dolum (${reports.filter(r => r.reportType === 'fridge').length})`} />
          </Tabs>
        </Box>

        {/* Aktif Sıralama Bilgisi */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Sıralama:</strong> {
              sortConfig.key === 'createdAt' ? 'Tarih' :
              sortConfig.key === 'location' ? 'Lokasyon' :
              sortConfig.key === 'machineSerialNumber' ? 'Makine Seri No' :
              sortConfig.key === 'userName' ? 'Kullanıcı' :
              sortConfig.key === 'status' ? 'Durum' :
              sortConfig.key === 'reportType' ? 'Rapor Türü' : 'Bilinmiyor'
            } ({sortConfig.direction === 'asc' ? 'Artan' : 'Azalan'})
            {sortConfig.key === 'createdAt' && sortConfig.direction === 'desc' && ' - En güncel raporlar üstte'}
          </Typography>
        </Alert>

        {filteredReports.length === 0 ? (
          <Alert severity="info">Henüz rapor bulunmuyor.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rapor ID</TableCell>
                    <TableCell 
                      onClick={() => handleSort('location')}
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        userSelect: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Lokasyon
                        {sortConfig.key === 'location' && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('machineSerialNumber')}
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        userSelect: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Makine Seri No
                        {sortConfig.key === 'machineSerialNumber' && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('userName')}
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        userSelect: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Kullanıcı
                        {sortConfig.key === 'userName' && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('createdAt')}
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        userSelect: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Tarih
                        {sortConfig.key === 'createdAt' && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('status')}
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        userSelect: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Durum
                        {sortConfig.key === 'status' && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('reportType')}
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        userSelect: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Rapor Türü
                        {sortConfig.key === 'reportType' && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReports.map((report) => (
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
                            title="Görüntüle"
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
            
            {/* Sayfalama */}
            <TablePagination
              component="div"
              count={sortedAndFilteredReports.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Sayfa başına rapor:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          </>
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
                      <Typography variant="subtitle1" gutterBottom>
                        Ekipman Kontrolü
                      </Typography>
                      <List dense>
                        {selectedReport.equipmentChecklist?.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={item.text}
                              secondary={item.completed ? 'Tamamlandı' : 'Beklemede'}
                            />
                            {item.completed && (
                              <CheckCircle color="success" />
                            )}
                          </ListItem>
                        ))}
                      </List>

                      {/* Temizlik Checklist */}
                      <Typography variant="subtitle1" gutterBottom>
                        Temizlik Kontrolü
                      </Typography>
                      <List dense>
                        {selectedReport.cleaningChecklist?.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={item.text}
                              secondary={item.completed ? 'Tamamlandı' : 'Beklemede'}
                            />
                            {item.completed && (
                              <CheckCircle color="success" />
                            )}
                          </ListItem>
                        ))}
                      </List>

                      {/* Dolum Detayları */}
                      {selectedReport.fillingDetails && (
                        <>
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
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
                        </>
                      )}
                    </>
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
