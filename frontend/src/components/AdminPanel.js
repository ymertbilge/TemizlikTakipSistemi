import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
  CardMedia, IconButton, Collapse, List, ListItem, ListItemText, Divider, Alert, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Tabs, Tab, CircularProgress,
  TablePagination
} from '@mui/material';
import { 
  Visibility, ExpandMore, ExpandLess, CheckCircle, Cancel, Delete, Download, Edit, CloudUpload, Add
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { reportService, userService, authService, commodityService } from '../services/firebaseService';
import { importCommoditiesFromJSON } from '../utils/importCommodities';

const AdminPanel = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [reportTypeFilter, setReportTypeFilter] = useState('all'); // 'all', 'iceCream', 'fridge'
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [locationFilter, setLocationFilter] = useState('');
  const [machineSerialFilter, setMachineSerialFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  // Commodity management states
  const [commoditySearch, setCommoditySearch] = useState('');
  const [commodityFilter, setCommodityFilter] = useState({
    supplier: '',
    type: '',
    productName: '',
    commodityCode: ''
  });
  const [commoditySortConfig, setCommoditySortConfig] = useState({ key: 'Product name', direction: 'asc' });
  const [commodities, setCommodities] = useState([]);
  const [filteredCommodities, setFilteredCommodities] = useState([]);
  const [newCommodity, setNewCommodity] = useState({
    'Commodity code': '',
    'Product name': '',
    'Unit price': '',
    'Cost price': '',
    'Supplier': '',
    'Specs': '',
    'Type': '',
    'Description': ''
  });
  const [editingCommodity, setEditingCommodity] = useState(null);
  const [commodityEditFormOpen, setCommodityEditFormOpen] = useState(false);
  const [commodityEditFormData, setCommodityEditFormData] = useState({
    'Commodity code': '',
    'Product name': '',
    'Unit price': '',
    'Cost price': '',
    'Supplier': '',
    'Specs': '',
    'Type': '',
    'Description': ''
  });
  
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

  // Sayfalama durumu
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Commodity sayfalama durumu
  const [commodityPage, setCommodityPage] = useState(0);
  const [commodityRowsPerPage, setCommodityRowsPerPage] = useState(10);

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

  const fetchCommodities = useCallback(async () => {
    try {
      const result = await commodityService.getAllCommodities();
      if (result.success) {
        setCommodities(result.commodities || []);
      } else {
        console.warn('Ürünler yüklenemedi:', result.error);
        setCommodities([]); // Boş liste olarak ayarla
      }
    } catch (error) {
      console.warn('Ürünler yüklenirken hata oluştu:', error);
      setCommodities([]); // Boş liste olarak ayarla
    }
  }, []);

  // Raporları filtrele
  useEffect(() => {
    let filtered = reports;
    
    // Rapor türüne göre filtrele
    switch (reportTypeFilter) {
      case 'iceCream':
        filtered = reports.filter(report => 
          !report.reportType || report.reportType === 'iceCream'
        );
        break;
      case 'fridge':
        filtered = reports.filter(report => 
          report.reportType === 'fridge'
        );
        break;
      default:
        filtered = reports;
    }
    
    // Tarihe göre filtrele
    if (dateFilter.startDate) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        const startDate = new Date(dateFilter.startDate);
        return reportDate >= startDate;
      });
    }
    
    if (dateFilter.endDate) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // Günün sonuna kadar
        return reportDate <= endDate;
      });
    }

    // Lokasyona göre filtrele
    if (locationFilter.trim()) {
      filtered = filtered.filter(report => 
        report.location && report.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    // Makine seri numarasına göre filtrele
    if (machineSerialFilter.trim()) {
      filtered = filtered.filter(report => 
        report.machineSerialNumber && report.machineSerialNumber.includes(machineSerialFilter)
      );
    }
    
    // Sıralama
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        case 'machineSerialNumber':
          aValue = (a.machineSerialNumber || '').toLowerCase();
          bValue = (b.machineSerialNumber || '').toLowerCase();
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
    
    setFilteredReports(filtered);
  }, [reports, reportTypeFilter, dateFilter, locationFilter, machineSerialFilter, sortConfig]);

  // Sayfalama için kullanılacak veriyi ayarla
  const paginatedReports = filteredReports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Sayfalama fonksiyonları
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Sayfayı sıfırla
  };

  // Commodity sayfalama fonksiyonları
  const handleCommodityChangePage = (event, newPage) => {
    setCommodityPage(newPage);
  };

  const handleCommodityChangeRowsPerPage = (event) => {
    setCommodityRowsPerPage(parseInt(event.target.value, 10));
    setCommodityPage(0); // Sayfayı sıfırla
  };

  // Commodity sıralama fonksiyonu
  const handleCommoditySort = (key) => {
    setCommoditySortConfig(prev => {
      if (prev.key === key) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Commodity filtreleme ve sıralama
  useEffect(() => {
    let filtered = commodities;

    // Genel arama
    if (commoditySearch.trim()) {
      const searchTerm = commoditySearch.toLowerCase();
      filtered = filtered.filter(commodity => 
        (commodity['Product name'] && commodity['Product name'].toLowerCase().includes(searchTerm)) ||
        (commodity['Commodity code'] && commodity['Commodity code'].toLowerCase().includes(searchTerm)) ||
        (commodity['Supplier'] && commodity['Supplier'].toLowerCase().includes(searchTerm)) ||
        (commodity['Type'] && commodity['Type'].toLowerCase().includes(searchTerm))
      );
    }

    // Tedarikçi filtresi
    if (commodityFilter.supplier.trim()) {
      filtered = filtered.filter(commodity => 
        commodity['Supplier'] && commodity['Supplier'].toLowerCase().includes(commodityFilter.supplier.toLowerCase())
      );
    }

    // Tip filtresi
    if (commodityFilter.type.trim()) {
      filtered = filtered.filter(commodity => 
        commodity['Type'] && commodity['Type'].toLowerCase().includes(commodityFilter.type.toLowerCase())
      );
    }

    // Ürün adı filtresi
    if (commodityFilter.productName.trim()) {
      filtered = filtered.filter(commodity => 
        commodity['Product name'] && commodity['Product name'].toLowerCase().includes(commodityFilter.productName.toLowerCase())
      );
    }

    // Ürün kodu filtresi
    if (commodityFilter.commodityCode.trim()) {
      filtered = filtered.filter(commodity => 
        commodity['Commodity code'] && commodity['Commodity code'].toLowerCase().includes(commodityFilter.commodityCode.toLowerCase())
      );
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (commoditySortConfig.key) {
        case 'Product name':
          aValue = (a['Product name'] || '').toLowerCase();
          bValue = (b['Product name'] || '').toLowerCase();
          break;
        case 'Commodity code':
          aValue = (a['Commodity code'] || '').toLowerCase();
          bValue = (b['Commodity code'] || '').toLowerCase();
          break;
        case 'Supplier':
          aValue = (a['Supplier'] || '').toLowerCase();
          bValue = (b['Supplier'] || '').toLowerCase();
          break;
        case 'Type':
          aValue = (a['Type'] || '').toLowerCase();
          bValue = (b['Type'] || '').toLowerCase();
          break;
        case 'Unit price':
          aValue = parseFloat(a['Unit price'] || 0);
          bValue = parseFloat(b['Unit price'] || 0);
          break;
        case 'Cost price':
          aValue = parseFloat(a['Cost price'] || 0);
          bValue = parseFloat(b['Cost price'] || 0);
          break;
        default:
          aValue = a[commoditySortConfig.key];
          bValue = b[commoditySortConfig.key];
      }
      
      if (aValue < bValue) {
        return commoditySortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return commoditySortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredCommodities(filtered);
    setCommodityPage(0); // Filtre değiştiğinde sayfa numarasını sıfırla
  }, [commodities, commoditySearch, commodityFilter, commoditySortConfig]);

  // Sayfalanmış commodity'leri hesapla
  const paginatedCommodities = filteredCommodities.slice(commodityPage * commodityRowsPerPage, commodityPage * commodityRowsPerPage + commodityRowsPerPage);

  // useEffect'i sonra kullan
  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchReports();
      fetchUsers();
      fetchCommodities();
    }
  }, [fetchReports, fetchUsers, fetchCommodities, userData]);

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

  // Commodity management functions
  const handleCreateCommodity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!newCommodity['Commodity code'] || !newCommodity['Product name']) {
        setError('Lütfen ürün kodu ve ürün adı alanlarını doldurun.');
        return;
      }

      const result = await commodityService.createCommodity(newCommodity);

      if (result.success) {
        setNewCommodity({
          'Commodity code': '',
          'Product name': '',
          'Unit price': '',
          'Cost price': '',
          'Supplier': '',
          'Specs': '',
          'Type': '',
          'Description': ''
        });
        setSuccess('Ürün başarıyla oluşturuldu!');
        fetchCommodities();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Ürün oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommodity = (commodity) => {
    setEditingCommodity(commodity);
    setCommodityEditFormData({
      'Commodity code': commodity['Commodity code'] || '',
      'Product name': commodity['Product name'] || '',
      'Unit price': commodity['Unit price'] || '',
      'Cost price': commodity['Cost price'] || '',
      'Supplier': commodity['Supplier'] || '',
      'Specs': commodity['Specs'] || '',
      'Type': commodity['Type'] || '',
      'Description': commodity['Description'] || ''
    });
    setCommodityEditFormOpen(true);
  };

  const handleSaveCommodityEdit = async () => {
    try {
      setLoading(true);
      const result = await commodityService.updateCommodity(editingCommodity.id, {
        ...commodityEditFormData,
        updatedAt: new Date().toISOString()
      });
      
      if (result.success) {
        fetchCommodities();
        setSuccess('Ürün başarıyla güncellendi!');
        setTimeout(() => setSuccess(''), 3000);
        setCommodityEditFormOpen(false);
        setEditingCommodity(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Ürün güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCommodityEditForm = () => {
    setCommodityEditFormOpen(false);
    setEditingCommodity(null);
    setCommodityEditFormData({
      'Commodity code': '',
      'Product name': '',
      'Unit price': '',
      'Cost price': '',
      'Supplier': '',
      'Specs': '',
      'Type': '',
      'Description': ''
    });
  };

  const handleDeleteCommodity = async (commodityId) => {
    try {
      setLoading(true);
      const result = await commodityService.deleteCommodity(commodityId);
      
      if (result.success) {
        setSuccess('Ürün başarıyla silindi!');
        fetchCommodities();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Ürün silinemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCommodities = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      const result = await importCommoditiesFromJSON(jsonData);
      
      if (result.success) {
        setSuccess(`${result.successCount} ürün başarıyla içe aktarıldı! ${result.errorCount} hatalı kayıt.`);
        fetchCommodities();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`İçe aktarma hatası: ${result.error}`);
      }
    } catch (error) {
      setError(`Dosya okuma hatası: ${error.message}`);
    } finally {
      setLoading(false);
      // Input'u temizle
      event.target.value = '';
    }
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
      const csvContent = generateCSV(filteredReports);
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
    const headers = ['ID', 'Lokasyon', 'Makine Seri No', 'Kullanıcı', 'Tarih', 'Durum', 'Rapor Türü', 'Notlar'];
    const rows = reports.map(report => [
      report.id,
      report.location,
      report.machineSerialNumber,
      report.userName,
      report.createdAt ? new Date(report.createdAt).toLocaleDateString('tr-TR') : '',
      report.status,
      report.reportType === 'fridge' ? 'Taze Dolap Dolum' : 'Dondurma Temizlik',
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

  const clearAllFilters = () => {
    setReportTypeFilter('all');
    setDateFilter({ startDate: '', endDate: '' });
    setLocationFilter('');
    setMachineSerialFilter('');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
    setPage(0); // Sayfa numarasını sıfırla
  };

  const clearCommodityFilters = () => {
    setCommoditySearch('');
    setCommodityFilter({
      supplier: '',
      type: '',
      productName: '',
      commodityCode: ''
    });
    setCommoditySortConfig({ key: 'Product name', direction: 'asc' });
    setCommodityPage(0); // Sayfa numarasını sıfırla
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
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
          <Tab label="Ürün Yönetimi" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Tüm Raporlar ({filteredReports.length})
                </Typography>
                <Button
                  variant="outlined"
                  onClick={clearAllFilters}
                  size="small"
                >
                  Tüm Filtreleri Temizle
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Rapor Türü</InputLabel>
                    <Select
                      value={reportTypeFilter}
                      label="Rapor Türü"
                      onChange={(e) => setReportTypeFilter(e.target.value)}
                    >
                      <MenuItem value="all">Tümü</MenuItem>
                      <MenuItem value="iceCream">Dondurma Temizlik</MenuItem>
                      <MenuItem value="fridge">Taze Dolap Dolum</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    type="date"
                    label="Başlangıç Tarihi"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    type="date"
                    label="Bitiş Tarihi"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Lokasyon"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Lokasyon ara..."
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Makine Seri No"
                    value={machineSerialFilter}
                    onChange={(e) => setMachineSerialFilter(e.target.value)}
                    placeholder="Seri no ara..."
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      Sıralama: {sortConfig.key === 'createdAt' ? 'Tarih' : sortConfig.key === 'location' ? 'Lokasyon' : 'Makine Seri No'} 
                      ({sortConfig.direction === 'asc' ? 'Artan' : 'Azalan'})
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleExportReports}
                disabled={filteredReports.length === 0 || loading}
                startIcon={<Download />}
              >
                CSV Olarak Dışa Aktar
              </Button>
            </Box>

            {/* Aktif Filtreler Bilgisi */}
            {(dateFilter.startDate || dateFilter.endDate || locationFilter || machineSerialFilter || reportTypeFilter !== 'all') && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Aktif Filtreler:</strong>
                  {dateFilter.startDate && ` Başlangıç: ${dateFilter.startDate}`}
                  {dateFilter.endDate && ` Bitiş: ${dateFilter.endDate}`}
                  {locationFilter && ` Lokasyon: "${locationFilter}"`}
                  {machineSerialFilter && ` Seri No: "${machineSerialFilter}"`}
                  {reportTypeFilter !== 'all' && ` Tür: ${reportTypeFilter === 'iceCream' ? 'Dondurma Temizlik' : 'Taze Dolap Dolum'}`}
                  <br />
                  <strong>Sıralama:</strong> {sortConfig.key === 'createdAt' ? 'Tarih' : sortConfig.key === 'location' ? 'Lokasyon' : 'Makine Seri No'} 
                  ({sortConfig.direction === 'asc' ? 'Artan' : 'Azalan'})
                </Typography>
              </Alert>
            )}

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
                        <TableCell>Kullanıcı</TableCell>
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
                        <TableCell>Durum</TableCell>
                        <TableCell>Rapor Türü</TableCell>
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
                
                {/* Sayfalama */}
                <TablePagination
                  component="div"
                  count={filteredReports.length}
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

        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ürün Yönetimi ({filteredCommodities.length}/{commodities.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={clearCommodityFilters}
                  size="small"
                >
                  Filtreleri Temizle
                </Button>
                <input
                  accept=".json"
                  style={{ display: 'none' }}
                  id="import-commodities"
                  type="file"
                  onChange={handleImportCommodities}
                />
                <label htmlFor="import-commodities">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={loading}
                  >
                    JSON'dan İçe Aktar
                  </Button>
                </label>
              </Box>
            </Box>

            {/* Ürün Arama ve Filtreleme */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Arama ve Filtreleme
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Genel Arama"
                    value={commoditySearch}
                    onChange={(e) => setCommoditySearch(e.target.value)}
                    placeholder="Ürün adı, kodu, tedarikçi veya tip ara..."
                    helperText="Tüm alanlarda arama yapar"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Tedarikçi Filtresi"
                    value={commodityFilter.supplier}
                    onChange={(e) => setCommodityFilter({ ...commodityFilter, supplier: e.target.value })}
                    placeholder="Tedarikçi ara..."
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Tip Filtresi"
                    value={commodityFilter.type}
                    onChange={(e) => setCommodityFilter({ ...commodityFilter, type: e.target.value })}
                    placeholder="Tip ara..."
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Ürün Adı Filtresi"
                    value={commodityFilter.productName}
                    onChange={(e) => setCommodityFilter({ ...commodityFilter, productName: e.target.value })}
                    placeholder="Ürün adı ara..."
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Ürün Kodu Filtresi"
                    value={commodityFilter.commodityCode}
                    onChange={(e) => setCommodityFilter({ ...commodityFilter, commodityCode: e.target.value })}
                    placeholder="Ürün kodu ara..."
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Aktif Ürün Filtreleri Bilgisi */}
            {(commoditySearch || commodityFilter.supplier || commodityFilter.type || commodityFilter.productName || commodityFilter.commodityCode) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Aktif Filtreler:</strong>
                  {commoditySearch && ` Genel Arama: "${commoditySearch}"`}
                  {commodityFilter.supplier && ` Tedarikçi: "${commodityFilter.supplier}"`}
                  {commodityFilter.type && ` Tip: "${commodityFilter.type}"`}
                  {commodityFilter.productName && ` Ürün Adı: "${commodityFilter.productName}"`}
                  {commodityFilter.commodityCode && ` Ürün Kodu: "${commodityFilter.commodityCode}"`}
                  <br />
                  <strong>Sıralama:</strong> {commoditySortConfig.key === 'Product name' ? 'Ürün Adı' : 
                    commoditySortConfig.key === 'Commodity code' ? 'Ürün Kodu' : 
                    commoditySortConfig.key === 'Supplier' ? 'Tedarikçi' : 
                    commoditySortConfig.key === 'Type' ? 'Tip' : 
                    commoditySortConfig.key === 'Unit price' ? 'Birim Fiyat' : 'Maliyet Fiyatı'} 
                  ({commoditySortConfig.direction === 'asc' ? 'Artan' : 'Azalan'})
                </Typography>
              </Alert>
            )}

            {/* Yeni Ürün Ekleme Formu */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Yeni Ürün Ekle
              </Typography>
              <Box component="form" onSubmit={handleCreateCommodity}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Ürün Kodu"
                      value={newCommodity['Commodity code']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Commodity code': e.target.value })}
                      required
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Ürün Adı"
                      value={newCommodity['Product name']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Product name': e.target.value })}
                      required
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Birim Fiyat"
                      type="number"
                      value={newCommodity['Unit price']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Unit price': e.target.value })}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Maliyet Fiyatı"
                      type="number"
                      value={newCommodity['Cost price']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Cost price': e.target.value })}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Tedarikçi"
                      value={newCommodity['Supplier']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Supplier': e.target.value })}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Özellikler"
                      value={newCommodity['Specs']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Specs': e.target.value })}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Tip"
                      value={newCommodity['Type']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Type': e.target.value })}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={newCommodity['Description']}
                      onChange={(e) => setNewCommodity({ ...newCommodity, 'Description': e.target.value })}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !newCommodity['Commodity code'] || !newCommodity['Product name']}
                      startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                    >
                      {loading ? 'Ekleniyor...' : 'Ürün Ekle'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Ürün Listesi */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            <TableContainer>
              <Table>
                                  <TableHead>
                    <TableRow>
                      <TableCell 
                        onClick={() => handleCommoditySort('Commodity code')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          userSelect: 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Ürün Kodu
                          {commoditySortConfig.key === 'Commodity code' && (
                            <Box component="span" sx={{ ml: 1 }}>
                              {commoditySortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleCommoditySort('Product name')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          userSelect: 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Ürün Adı
                          {commoditySortConfig.key === 'Product name' && (
                            <Box component="span" sx={{ ml: 1 }}>
                              {commoditySortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleCommoditySort('Unit price')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          userSelect: 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Birim Fiyat
                          {commoditySortConfig.key === 'Unit price' && (
                            <Box component="span" sx={{ ml: 1 }}>
                              {commoditySortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleCommoditySort('Cost price')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          userSelect: 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Maliyet Fiyatı
                          {commoditySortConfig.key === 'Cost price' && (
                            <Box component="span" sx={{ ml: 1 }}>
                              {commoditySortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleCommoditySort('Supplier')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          userSelect: 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Tedarikçi
                          {commoditySortConfig.key === 'Supplier' && (
                            <Box component="span" sx={{ ml: 1 }}>
                              {commoditySortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleCommoditySort('Type')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          userSelect: 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Tip
                          {commoditySortConfig.key === 'Type' && (
                            <Box component="span" sx={{ ml: 1 }}>
                              {commoditySortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                                  <TableBody>
                    {paginatedCommodities.map((commodity) => (
                    <TableRow key={commodity.id}>
                      <TableCell>{commodity['Commodity code']}</TableCell>
                      <TableCell>{commodity['Product name']}</TableCell>
                      <TableCell>{commodity['Unit price']} ₺</TableCell>
                      <TableCell>{commodity['Cost price']} ₺</TableCell>
                      <TableCell>{commodity['Supplier']}</TableCell>
                      <TableCell>{commodity['Type']}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditCommodity(commodity)}
                            disabled={loading}
                            startIcon={<Edit />}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteCommodity(commodity.id)}
                            disabled={loading}
                            startIcon={<Delete />}
                          >
                            Sil
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedCommodities.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary">
                          {commodities.length === 0 ? 'Henüz ürün bulunmuyor' : 'Filtre kriterlerine uygun ürün bulunamadı'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Commodity Sayfalama */}
            <TablePagination
              component="div"
              count={filteredCommodities.length}
              page={commodityPage}
              onPageChange={handleCommodityChangePage}
              rowsPerPage={commodityRowsPerPage}
              onRowsPerPageChange={handleCommodityChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Sayfa başına ürün:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
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

      {/* Ürün Düzenleme Dialog */}
      <Dialog
        open={commodityEditFormOpen}
        onClose={handleCloseCommodityEditForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Ürün Düzenle: {editingCommodity?.['Product name']}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Ürün Kodu"
                  value={commodityEditFormData['Commodity code']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Commodity code': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Ürün Adı"
                  value={commodityEditFormData['Product name']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Product name': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Birim Fiyat"
                  type="number"
                  value={commodityEditFormData['Unit price']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Unit price': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Maliyet Fiyatı"
                  type="number"
                  value={commodityEditFormData['Cost price']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Cost price': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Tedarikçi"
                  value={commodityEditFormData['Supplier']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Supplier': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Özellikler"
                  value={commodityEditFormData['Specs']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Specs': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Tip"
                  value={commodityEditFormData['Type']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Type': e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Açıklama"
                  value={commodityEditFormData['Description']}
                  onChange={(e) => setCommodityEditFormData({ ...commodityEditFormData, 'Description': e.target.value })}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommodityEditForm}>
            İptal
          </Button>
          <Button 
            onClick={handleSaveCommodityEdit} 
            color="primary" 
            variant="contained"
            disabled={loading || !commodityEditFormData['Commodity code'].trim() || !commodityEditFormData['Product name'].trim()}
          >
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;