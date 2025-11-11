import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { Usuario } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: Usuario | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mocked user and profile to bypass login for testing
  const mockUser = { uid: 'mock-admin-uid', email: 'admin@test.com' } as User;
  const mockAdminProfile: Usuario = {
    id: 'mock-admin-uid',
    name: 'Admin de Testes',
    email: 'admin@test.com',
    role: 'Admin'
  };

  const [user, setUser] = useState<User | null>(mockUser);
  const [userProfile, setUserProfile] = useState<Usuario | null>(mockAdminProfile);
  const [loading, setLoading] = useState(false); // Start with loading false

  // The original useEffect that listens to Firebase Auth state changes is removed.
  // This effectively forces the app to always be in a "logged-in as Admin" state.

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
