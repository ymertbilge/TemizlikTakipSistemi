import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, push, remove, update, query, orderByChild, equalTo } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase yapılandırması - .env dosyasından alınacak
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Firebase Realtime Database referansları - Firebase v9 syntax
const getReportsRef = () => ref(database, 'temizlikTakip/reports');
const getUsersRef = () => ref(database, 'temizlikTakip/users');
const getReportRef = (reportId) => ref(database, `temizlikTakip/reports/${reportId}`);
const getUserRef = (userId) => ref(database, `temizlikTakip/users/${userId}`);

// Auth Servisi
export const authService = {
  // Kullanıcı girişi
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Kullanıcı bilgilerini veritabanından al
      const userSnapshot = await get(getUserRef(user.uid));
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        
        // lastLogin'i güncelle
        const currentTime = new Date().toISOString();
        await update(getUserRef(user.uid), {
          lastLogin: currentTime,
          updatedAt: currentTime
        });
        
        return { 
          success: true, 
          user: { 
            uid: user.uid, 
            email: user.email,
            ...userData,
            lastLogin: currentTime
          } 
        };
      } else {
        return { success: false, error: 'Kullanıcı bilgileri bulunamadı' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı çıkışı
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı oluştur
  async createUser(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Kullanıcı bilgilerini veritabanına kaydet
      const newUser = {
        id: user.uid,
        email: user.email,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(getUserRef(user.uid), newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Auth state listener
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Mevcut kullanıcı
  getCurrentUser() {
    return auth.currentUser;
  },

  // Kullanıcı bilgilerini getir
  async getUserById(userId) {
    try {
      const snapshot = await get(getUserRef(userId));
      if (snapshot.exists()) {
        return { 
          success: true, 
          user: { id: snapshot.key, ...snapshot.val() } 
        };
      }
      return { success: false, error: 'Kullanıcı bulunamadı' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Rapor Servisleri
export const reportService = {
  // Tüm raporları getir
  async getAllReports() {
    try {
      const snapshot = await get(getReportsRef());
      
      if (snapshot.exists()) {
        const reports = [];
        snapshot.forEach((childSnapshot) => {
          reports.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, reports };
      }
      return { success: true, reports: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcının raporlarını getir
  async getUserReports(userId) {
    try {
      
      // userId kontrolü
      if (!userId) {
        return { success: false, error: 'Kullanıcı kimliği gerekli' };
      }
      
      const reportsQuery = query(
        getReportsRef(),
        orderByChild('userId'),
        equalTo(userId)
      );
      const snapshot = await get(reportsQuery);
      
      if (snapshot.exists()) {
        const reports = [];
        snapshot.forEach((childSnapshot) => {
          reports.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, reports };
      }
      return { success: true, reports: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rapor oluştur
  async createReport(reportData) {
    try {
      const newReportRef = push(getReportsRef());
      const reportId = newReportRef.key;
      
      const report = {
        id: reportId,
        ...reportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newReportRef, report);
      
      return { success: true, reportId, report };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rapor güncelle
  async updateReport(reportId, updateData) {
    try {
      const reportRef = getReportRef(reportId);
      await update(reportRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rapor sil
  async deleteReport(reportId) {
    try {
      // Önce raporu getir
      const reportSnapshot = await get(getReportRef(reportId));
      if (!reportSnapshot.exists()) {
        return { success: false, error: 'Rapor bulunamadı' };
      }

      // Raporu sil (fotoğraflar URL olarak saklandığı için ayrı silmeye gerek yok)
      await remove(getReportRef(reportId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rapor detayını getir
  async getReportById(reportId) {
    try {
      const snapshot = await get(getReportRef(reportId));
      if (snapshot.exists()) {
        return { 
          success: true, 
          report: { id: snapshot.key, ...snapshot.val() } 
        };
      }
      return { success: false, error: 'Rapor bulunamadı' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Kullanıcı Servisleri
export const userService = {
  // Tüm kullanıcıları getir
  async getAllUsers() {
    try {
      const snapshot = await get(getUsersRef());
      
      if (snapshot.exists()) {
        const users = [];
        snapshot.forEach((childSnapshot) => {
          users.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, users };
      }
      return { success: true, users: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı getir
  async getUserById(userId) {
    try {
      const snapshot = await get(getUserRef(userId));
      if (snapshot.exists()) {
        return { 
          success: true, 
          user: { id: snapshot.key, ...snapshot.val() } 
        };
      }
      return { success: false, error: 'Kullanıcı bulunamadı' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı güncelle
  async updateUser(userId, updateData) {
    try {
      const userRef = getUserRef(userId);
      await update(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı sil
  async deleteUser(userId) {
    try {
      await remove(getUserRef(userId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Fotoğraf Servisi (LocalStorage + Sıkıştırılmış Base64)
export const photoService = {
  // Fotoğrafı sıkıştırılmış base64 olarak kaydet
  async savePhotoUrl(photoFile, folder = 'general') {
    try {
      
      // Dosyayı sıkıştır ve base64'e çevir
      const compressedBase64 = await this.compressAndConvertToBase64(photoFile);
      
      return { success: true, url: compressedBase64 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Çoklu fotoğrafları sıkıştırılmış base64 olarak kaydet
  async saveMultiplePhotoUrls(photoFiles, folder = 'general') {
    try {
      
      const compressedBase64Array = [];
      for (const file of photoFiles) {
        const compressedBase64 = await this.compressAndConvertToBase64(file);
        compressedBase64Array.push(compressedBase64);
      }
      
      return {
        success: true,
        photos: compressedBase64Array
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Dosyayı sıkıştır ve base64'e çevir
  async compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Canvas boyutunu ayarla (maksimum 800x600)
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Fotoğrafı canvas'a çiz
          ctx.drawImage(img, 0, 0, width, height);
          
          // JPEG olarak sıkıştır (kalite: 0.7)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Resim yüklenemedi'));
      
      // Dosyayı oku
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });
  },

  // Fotoğrafı localStorage'a kaydet (büyük dosyalar için)
  async savePhotoToLocalStorage(photoFile, reportId, type) {
    try {
      
      const compressedBase64 = await this.compressAndConvertToBase64(photoFile);
      const photoKey = `photo_${reportId}_${type}_${Date.now()}`;
      
      // localStorage'a kaydet
      localStorage.setItem(photoKey, compressedBase64);
      
      return { 
        success: true, 
        url: compressedBase64,
        storageKey: photoKey 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // localStorage'dan fotoğrafı getir
  async getPhotoFromLocalStorage(storageKey) {
    try {
      const photoData = localStorage.getItem(storageKey);
      if (photoData) {
        return { success: true, url: photoData };
      }
      return { success: false, error: 'Fotoğraf bulunamadı' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // localStorage'dan fotoğrafı sil
  async deletePhotoFromLocalStorage(storageKey) {
    try {
      localStorage.removeItem(storageKey);
      return { success: true, message: 'Fotoğraf localStorage\'dan silindi' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Fotoğraf URL'ini sil
  async deletePhotoUrl(photoUrl) {
    try {
      return { success: true, message: 'Fotoğraf silindi' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Default export
const firebaseService = {
  authService,
  reportService,
  userService,
  photoService
};

export default firebaseService;
