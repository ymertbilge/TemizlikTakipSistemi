import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { PhotoCamera, Delete, CloudUpload, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reportService, photoService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

// Error Boundary Component - güçlendirilmiş
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Bir hata oluştu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Uygulama beklenmeyen bir hata ile karşılaştı. Lütfen tekrar deneyin.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            sx={{ mr: 1 }}
          >
            Tekrar Dene
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => window.location.reload()}
          >
            Sayfayı Yenile
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Türkçe karakterleri ve özel karakterleri temizle - ASCII safe
const cleanLocation = (location) => {
  return location
    // Türkçe karakterler
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/I/g, 'I')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    // Özel karakterler
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    // Birden fazla boşluğu tek boşluğa çevir
    .replace(/\s+/g, ' ')
    // Başındaki ve sonundaki boşlukları kaldır
    .trim();
};

const NewReport = () => {
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // Component unmount kontrolü için ref
  const isMounted = useRef(true);
  
  // Form state
  const [formData, setFormData] = useState({
    location: '',
    machineSerialNumber: '',
    notes: ''
  });

  // Checklist states
  const [equipmentChecklist, setEquipmentChecklist] = useState([
    { id: 1, text: 'Makine çalışma kontrolü', completed: false, completedAt: null },
    { id: 2, text: 'Soğutma sistemi kontrolü', completed: false, completedAt: null },
    { id: 3, text: 'Elektrik sistemi kontrolü', completed: false, completedAt: null },
    { id: 4, text: 'Sensör kontrolü', completed: false, completedAt: null },
    { id: 5, text: 'Güvenlik sistemi kontrolü', completed: false, completedAt: null },
    { id: 6, text: 'Ekran ve buton kontrolü', completed: false, completedAt: null }
  ]);

  const [cleaningChecklist, setCleaningChecklist] = useState([
    { id: 1, text: 'Hazne temizliği', completed: false, completedAt: null },
    { id: 2, text: 'Sos ve süsleme kapları temizliği', completed: false, completedAt: null },
    { id: 3, text: 'İç mekan temizliği', completed: false, completedAt: null },
    { id: 4, text: 'Dış cephe temizliği', completed: false, completedAt: null },
    { id: 5, text: 'Nozul temizliği', completed: false, completedAt: null },
    { id: 6, text: 'Filtre temizliği', completed: false, completedAt: null }
  ]);

  // Dolum detayları state
  const [fillingDetails, setFillingDetails] = useState({
    iceCreamBase: {
      amount: '',
      unit: '',
      unitType: ''
    },
    toppings: [],
    sauces: []
  });

  // Fotoğraf state'leri
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [issuePhotos, setIssuePhotos] = useState([]);
  
  // Cleanup effect - bellek sızıntılarını önle
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // useEffect dependency'lerini düzelt
  useEffect(() => {
    return () => {
      // Cleanup: Object URL'leri temizle
      beforePhotos.forEach(photo => {
        if (photo.preview && photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
      afterPhotos.forEach(photo => {
        if (photo.preview && photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
      issuePhotos.forEach(photo => {
        if (photo.preview && photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, [beforePhotos, afterPhotos, issuePhotos]);

  // userData yüklenene kadar bekle
  if (authLoading || !userData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Kullanıcı bilgileri yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // State güncellemelerini güvenli hale getir
  const safeSetState = (setter, value) => {
    if (isMounted.current) {
      setter(value);
    }
  };

  // Form input değişikliklerini handle et
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Checklist item'larını toggle et
  const toggleChecklistItem = (checklistType, itemId) => {
    const setChecklist = checklistType === 'equipment' ? setEquipmentChecklist : setCleaningChecklist;
    
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { 
          ...item, 
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : null
          }
        : item
    ));
  };

  // Dolum detaylarını güncelle
  const handleFillingChange = (category, field, value) => {
    setFillingDetails(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
      [field]: value
      }
    }));
  };

  // Sos ekleme
  const addSauce = () => {
    setFillingDetails(prev => ({
      ...prev,
      sauces: [...(prev.sauces || []), { id: Date.now(), name: '', brand: '', amount: '', unit: '' }]
    }));
  };

  // Sos silme
  const removeSauce = (id) => {
    setFillingDetails(prev => ({
      ...prev,
      sauces: prev.sauces.filter(sauce => sauce.id !== id)
    }));
  };

  // Sos güncelleme
  const updateSauce = (id, field, value) => {
    setFillingDetails(prev => ({
      ...prev,
      sauces: prev.sauces.map(sauce => 
        sauce.id === id ? { ...sauce, [field]: value } : sauce
      )
    }));
  };

  // Süsleme ekleme
  const addTopping = () => {
    setFillingDetails(prev => ({
      ...prev,
      toppings: [...(prev.toppings || []), { id: Date.now(), name: '', brand: '', amount: '', unit: '' }]
    }));
  };

  // Süsleme silme
  const removeTopping = (id) => {
    setFillingDetails(prev => ({
      ...prev,
      toppings: prev.toppings.filter(topping => topping.id !== id)
    }));
  };

  // Süsleme güncelleme
  const updateTopping = (id, field, value) => {
    setFillingDetails(prev => ({
      ...prev,
      toppings: prev.toppings.map(topping => 
        topping.id === id ? { ...topping, [field]: value } : topping
      )
    }));
  };

  // Fotoğraf ekle
  const handlePhotoAdd = async (files, type) => {
    try {
      setLoading(true);
      
      // Dosyaları base64 olarak kaydet
      const uploadResult = await photoService.saveMultiplePhotoUrls(files, type);
      if (uploadResult.success) {
        const newPhotos = uploadResult.photos.map((base64, index) => ({
          id: Date.now() + index,
          url: base64,
          preview: base64, // Base64 direkt preview olarak kullanılabilir
          name: files[index]?.name || `photo_${index}`,
          file: files[index] // Orijinal dosyayı sakla
        }));
        
        switch (type) {
          case 'before': setBeforePhotos(prev => [...prev, ...newPhotos]); break;
          case 'after': setAfterPhotos(prev => [...prev, ...newPhotos]); break;
          case 'issue': setIssuePhotos(prev => [...prev, ...newPhotos]); break;
          default: break;
        }
        
        setSuccess(`${type === 'before' ? 'Öncesi' : type === 'after' ? 'Sonrası' : 'Sorun'} fotoğrafları başarıyla yüklendi!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Fotoğraf yüklenemedi: ${uploadResult.errors?.join(', ')}`);
      }
    } catch (error) {
      setError('Fotoğraf yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Fotoğraf sil
  const handlePhotoDelete = async (photoId, type) => {
    try {
      let photoToDelete;
      switch (type) {
        case 'before': photoToDelete = beforePhotos.find(p => p.id === photoId); break;
        case 'after': photoToDelete = afterPhotos.find(p => p.id === photoId); break;
        case 'issue': photoToDelete = issuePhotos.find(p => p.id === photoId); break;
        default: break;
      }
      
      if (photoToDelete) {
        // Base64 veritabanından kaldırma işlemi
        await photoService.deletePhotoUrl(photoToDelete.url);
      }
      
      // Update state after successful deletion
      switch (type) {
        case 'before': setBeforePhotos(prev => prev.filter(p => p.id !== photoId)); break;
        case 'after': setAfterPhotos(prev => prev.filter(p => p.id !== photoId)); break;
        case 'issue': setIssuePhotos(prev => prev.filter(p => p.id !== photoId)); break;
        default: break;
      }
      
      setSuccess('Fotoğraf başarıyla silindi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Fotoğraf silinirken hata oluştu');
    }
  };

  // Rapor başlığı oluştur
  const generateReportTitle = () => {
      const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    
    return `${cleanLocation(formData.location)}-${formData.machineSerialNumber}-${dateStr}${timeStr}`;
  };

  // Rapor gönder
  const handleSubmit = async (e) => {
    e.preventDefault();

    // userData kontrolü
    if (!userData || !userData.uid) {
      safeSetState(setError, 'Kullanıcı bilgileri yüklenemedi. Lütfen tekrar giriş yapın.');
      return;
    }

    if (!formData.location.trim() || !formData.machineSerialNumber.trim()) {
      safeSetState(setError, 'Lütfen lokasyon ve makine seri numarası alanlarını doldurun');
      return;
    }

    // Makine seri numarası formatını kontrol et (10 haneli sayı)
    const serialNumberRegex = /^\d{10}$/;
    if (!serialNumberRegex.test(formData.machineSerialNumber.trim())) {
      safeSetState(setError, 'Makine seri numarası 10 haneli sayı olmalıdır (Örn: 2403290003)');
      return;
    }

    // Fotoğraf zorunluluğu kontrolü
    if (beforePhotos.length === 0) {
      safeSetState(setError, 'En az bir "Öncesi" fotoğraf eklemek zorunludur!');
      return;
    }

    if (afterPhotos.length === 0) {
      safeSetState(setError, 'En az bir "Sonrası" fotoğraf eklemek zorunludur!');
      return;
    }

    safeSetState(setLoading, true);
    safeSetState(setError, '');
    safeSetState(setSuccess, '');

    try {
      // Fotoğrafları rapor verisine ekle
      const photoUploads = [];
      
      for (const photo of beforePhotos) {
        photoUploads.push({ type: 'before', url: photo.url });
      }

      for (const photo of afterPhotos) {
        photoUploads.push({ type: 'after', url: photo.url });
      }

      for (const photo of issuePhotos) {
        photoUploads.push({ type: 'issue', url: photo.url });
      }

      const reportData = {
        location: cleanLocation(formData.location),
        machineSerialNumber: formData.machineSerialNumber.trim(),
        notes: formData.notes.trim(),
        equipmentChecklist: equipmentChecklist.map(item => ({
          id: item.id, 
          text: item.text, 
          completed: item.completed, 
          completedAt: item.completedAt
        })),
        cleaningChecklist: cleaningChecklist.map(item => ({
          id: item.id, 
          text: item.text, 
          completed: item.completed, 
          completedAt: item.completedAt
        })),
        fillingDetails,
        beforePhotos: photoUploads.filter(p => p.type === 'before').map(p => p.url),
        afterPhotos: photoUploads.filter(p => p.type === 'after').map(p => p.url),
        issuePhotos: photoUploads.filter(p => p.type === 'issue').map(p => p.url),
        status: 'completed',
        title: generateReportTitle(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userData.uid, // Kullanıcı ID'sini otomatik ekle
        userName: userData.name // Kullanıcı adını da ekle
      };

      const result = await reportService.createReport(reportData);

      if (result.success) {
        safeSetState(setSuccess, 'Rapor başarıyla oluşturuldu! Dashboard\'a yönlendiriliyorsunuz...');
        
        // Countdown başlat
        let count = 3;
        safeSetState(setCountdown, count);
        
        const countdownInterval = setInterval(() => {
          count--;
          safeSetState(setCountdown, count);
          
          if (count <= 0) {
            clearInterval(countdownInterval);
            
            try {
              navigate('/', { replace: true });
            } catch (navError) {
              // Fallback: window.location ile yönlendir
              window.location.href = '/';
            }
          }
        }, 1000);
      } else {
        throw new Error(result.error || 'Rapor oluşturulamadı');
      }

    } catch (error) {
      safeSetState(setError, `Rapor gönderilemedi: ${error.message}`);
    } finally {
        safeSetState(setLoading, false);
    }
  };


  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
          Yeni Temizlik Raporu
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success} {countdown > 0 && `(${countdown} saniye sonra yönlendirileceksiniz)`}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* Temel Bilgiler */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          Temel Bilgiler
        </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Lokasyon"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
                  placeholder="Örn: İstanbul, Kadıköy"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Makine Seri Numarası"
              value={formData.machineSerialNumber}
              onChange={(e) => handleInputChange('machineSerialNumber', e.target.value)}
              required
                  placeholder="Örn: 2403290003"
            />
          </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notlar"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Ek notlar, özel durumlar..."
                />
        </Grid>
            </Grid>

            {/* Ekipman Kontrol Listesi */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
              Ekipman Kontrol Listesi
        </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {equipmentChecklist.map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.completed}
                        onChange={() => toggleChecklistItem('equipment', item.id)}
                        color="primary"
                      />
                    }
                    label={item.text}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Temizlik Kontrol Listesi */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
              Temizlik Kontrol Listesi
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {cleaningChecklist.map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.completed}
                        onChange={() => toggleChecklistItem('cleaning', item.id)}
                        color="primary"
                      />
                    }
                    label={item.text}
                  />
                </Grid>
              ))}
            </Grid>

      {/* Dolum Detayları */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          Dolum Detayları
        </Typography>
        
            <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Dondurma Bazı */}
               <Grid item xs={12} md={6}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Dondurma Bazı
        </Typography>
        <Grid container spacing={2}>
                   <Grid item xs={12} md={6}>
            <TextField
              fullWidth
                       label="Miktar"
                       value={fillingDetails.iceCreamBase.amount}
                       onChange={(e) => handleFillingChange('iceCreamBase', 'amount', e.target.value)}
                       placeholder="Örn: 50"
            />
          </Grid>
                   <Grid item xs={12} md={6}>
            <TextField
              fullWidth
                       label="Birim Tipi"
                       value={fillingDetails.iceCreamBase.unitType}
                       onChange={(e) => handleFillingChange('iceCreamBase', 'unitType', e.target.value)}
                       placeholder="Miktar veya %"
            />
          </Grid>
                   <Grid item xs={12} md={6}>
            <TextField
              fullWidth
                       label="Birim"
                       value={fillingDetails.iceCreamBase.unit}
                       onChange={(e) => handleFillingChange('iceCreamBase', 'unit', e.target.value)}
                       placeholder="kg, lt, %"
                     />
                   </Grid>
          </Grid>
        </Grid>

               {/* Süsleme */}
               <Grid item xs={12} md={6}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                   Süsleme
        </Typography>
                 {fillingDetails.toppings && fillingDetails.toppings.map((topping) => (
                   <Box key={topping.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <TextField
                       size="small"
                       label="Süsleme Adı"
                       value={topping.name}
                       onChange={(e) => updateTopping(topping.id, 'name', e.target.value)}
                       placeholder="Örn: Çikolata"
                       sx={{ flex: 1 }}
                     />
              <TextField
                       size="small"
                       label="Marka"
                       value={topping.brand}
                       onChange={(e) => updateTopping(topping.id, 'brand', e.target.value)}
                       placeholder="Örn: Ferrero"
                       sx={{ width: 150 }}
                     />
                     <TextField
                       size="small"
                label="Miktar"
                       value={topping.amount}
                       onChange={(e) => updateTopping(topping.id, 'amount', e.target.value)}
                       placeholder="Örn: 50"
                       sx={{ width: 120 }}
                     />
                     <TextField
                       size="small"
                       label="Birim"
                       value={topping.unit}
                       onChange={(e) => updateTopping(topping.id, 'unit', e.target.value)}
                       placeholder="gr, kg"
                       sx={{ width: 100 }}
                     />
                     <IconButton
                       size="small"
                       onClick={() => removeTopping(topping.id)}
                color="error"
                     >
                       <Delete />
                     </IconButton>
                   </Box>
        ))}
        <Button
          variant="outlined"
                   onClick={addTopping}
                   startIcon={<Add />}
                   size="small"
                   sx={{ mt: 1 }}
                 >
                   Süsleme Ekle
        </Button>
               </Grid>

               {/* Sos */}
               <Grid item xs={12} md={6}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                   Sos
        </Typography>
                 {fillingDetails.sauces && fillingDetails.sauces.map((sauce) => (
                   <Box key={sauce.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <TextField
                       size="small"
                       label="Sos Adı"
                       value={sauce.name}
                       onChange={(e) => updateSauce(sauce.id, 'name', e.target.value)}
                       placeholder="Örn: Çikolata Sosu"
                       sx={{ flex: 1 }}
                     />
              <TextField
                       size="small"
                       label="Marka"
                       value={sauce.brand}
                       onChange={(e) => updateSauce(sauce.id, 'brand', e.target.value)}
                       placeholder="Örn: Ferrero"
                       sx={{ width: 150 }}
                     />
                     <TextField
                       size="small"
                label="Miktar"
                       value={sauce.amount}
                       onChange={(e) => updateSauce(sauce.id, 'amount', e.target.value)}
                       placeholder="Örn: 100"
                       sx={{ width: 120 }}
                     />
                     <TextField
                       size="small"
                       label="Birim"
                       value={sauce.unit}
                       onChange={(e) => updateSauce(sauce.id, 'unit', e.target.value)}
                       placeholder="ml, lt"
                       sx={{ width: 100 }}
                     />
                     <IconButton
                       size="small"
                       onClick={() => removeSauce(sauce.id)}
                color="error"
                     >
                       <Delete />
                     </IconButton>
                   </Box>
        ))}
        <Button
          variant="outlined"
                   onClick={addSauce}
                   startIcon={<Add />}
                   size="small"
                   sx={{ mt: 1 }}
                 >
                   Sos Ekle
        </Button>
               </Grid>
            </Grid>

            {/* Fotoğraflar */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
              Fotoğraflar <span style={{ color: 'red', fontSize: '0.8em' }}>* Zorunlu</span>
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Before Photos */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Öncesi Fotoğraflar <span style={{ color: 'red' }}>*</span>
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="before-photos"
                  multiple
                  type="file"
                  onChange={(e) => handlePhotoAdd(e.target.files, 'before')}
                />
                <label htmlFor="before-photos">
        <Button
          variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    fullWidth
        >
                    Fotoğraf Ekle
        </Button>
                </label>
                {beforePhotos.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8em' }}>
                    En az bir fotoğraf eklemek zorunludur
                  </Alert>
                )}
                {beforePhotos.map((photo) => (
                  <Box key={photo.id} sx={{ mt: 2, position: 'relative' }}>
                    <img
                      src={photo.preview}
                      alt="Before"
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 5, right: 5 }}
                      onClick={() => handlePhotoDelete(photo.id, 'before')}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Grid>

              {/* After Photos */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Sonrası Fotoğraflar <span style={{ color: 'red' }}>*</span>
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="after-photos"
                  multiple
                  type="file"
                  onChange={(e) => handlePhotoAdd(e.target.files, 'after')}
                />
                <label htmlFor="after-photos">
          <Button
            variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    fullWidth
                  >
                    Fotoğraf Ekle
          </Button>
                </label>
                {afterPhotos.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8em' }}>
                    En az bir fotoğraf eklemek zorunludur
                  </Alert>
                )}
                {afterPhotos.map((photo) => (
                  <Box key={photo.id} sx={{ mt: 2, position: 'relative' }}>
                    <img
                      src={photo.preview}
                      alt="After"
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 5, right: 5 }}
                      onClick={() => handlePhotoDelete(photo.id, 'after')}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Grid>

              {/* Issue Photos */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Sorun Fotoğrafları <span style={{ color: 'gray', fontSize: '0.8em' }}>(Opsiyonel)</span>
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="issue-photos"
                  multiple
                  type="file"
                  onChange={(e) => handlePhotoAdd(e.target.files, 'issue')}
                />
                <label htmlFor="issue-photos">
          <Button
            variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    fullWidth
                  >
                    Fotoğraf Ekle
          </Button>
                </label>
                {issuePhotos.map((photo) => (
                  <Box key={photo.id} sx={{ mt: 2, position: 'relative' }}>
                    <img
                      src={photo.preview}
                      alt="Issue"
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 5, right: 5 }}
                      onClick={() => handlePhotoDelete(photo.id, 'issue')}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
                type="submit"
          variant="contained"
          size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                sx={{ minWidth: 200 }}
        >
                {loading ? 'Gönderiliyor...' : 'Raporu Gönder'}
        </Button>
      </Box>
          </Box>
          </Paper>
    </Container>
    </ErrorBoundary>
  );
};

export default NewReport;