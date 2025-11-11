import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Usuario } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: Usuario | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data to bypass login
const mockUser: User = {
  uid: 'mock-admin-uid',
  email: 'rafaelmilfont@gmail.com',
  displayName: 'Rafael Milfont',
} as User;

const mockUserProfile: Usuario = {
  id: 'mock-admin-uid',
  name: 'Rafael Milfont',
  email: 'rafaelmilfont@gmail.com',
  role: 'Admin',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser);
  const [userProfile, setUserProfile] = useState<Usuario | null>(mockUserProfile);
  const [loading, setLoading] = useState(false); // Set to false to immediately load the app

  useEffect(() => {
    // Firebase onAuthStateChanged logic is removed.
    // The app will always use the mock user.
  }, []);


  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};