import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/firebaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Kullanıcı bilgilerini veritabanından al
          const userResult = await authService.getUserById(user.uid);
          
          if (userResult.success) {
            setCurrentUser(user.uid);
            setUserData({
              ...userResult.user,
              uid: user.uid // Ensure UID is always present
            });
          } else {
            setCurrentUser(null);
            setUserData(null);
          }
        } catch (error) {
          setCurrentUser(null);
          setUserData(null);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      
      setLoading(false);
      
      if (!initialized) {
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [initialized]);

  // Login function
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setCurrentUser(result.user.uid);
        setUserData({
          ...result.user,
          uid: result.user.uid // Ensure UID is always present
        });
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const result = await authService.logout();
      
      if (result.success) {
        setCurrentUser(null);
        setUserData(null);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Create user function
  const createUser = async (email, password, userData) => {
    try {
      const result = await authService.createUser(email, password, userData);
      
      if (result.success) {
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Get current user from Firebase
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  const value = {
    currentUser,
    userData,
    loading,
    initialized,
    login,
    logout,
    createUser,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};