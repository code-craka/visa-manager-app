import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  role?: 'agency' | 'partner';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncUserWithBackend: (role: 'agency' | 'partner') => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Backend API base URL - adjust this to your backend URL
  const API_BASE_URL = 'http://localhost:3000/api';

  const checkAuthState = useCallback(async () => {
    try {
      setIsLoading(true);
      // Check if we have a stored auth token
      const storedToken = authToken;
      
      if (storedToken) {
        // Try to get user profile from backend
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.user.id || 'mock-user-id',
            email: userData.user.email || 'user@example.com',
            displayName: userData.user.displayName || 'Mock User',
            role: userData.user.role,
          });
        } else {
          // Token invalid, clear auth
          setAuthToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, API_BASE_URL]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // For development, create a mock token
      // In production, this would authenticate with Stack Auth
      const mockToken = `mock-token-${Date.now()}`;
      
      // Try to sync with backend first
      const response = await fetch(`${API_BASE_URL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: 'agency' // Default role for development
        }),
      });

      if (response.ok) {
        setAuthToken(mockToken);
        await checkAuthState();
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true);
      
      // For development, create a mock token
      const mockToken = `mock-token-${Date.now()}`;
      
      // Try to sync with backend
      const response = await fetch(`${API_BASE_URL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: 'agency' // Default role for development
        }),
      });

      if (response.ok) {
        setAuthToken(mockToken);
        await checkAuthState();
      } else {
        throw new Error('Sign up failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncUserWithBackend = async (role: 'agency' | 'partner') => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user with backend');
      }

      const userData = await response.json();
      
      // Update user state with role
      setUser(prev => prev ? { ...prev, role: userData.user.role } : null);
      
      return userData;
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    return authToken;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    syncUserWithBackend,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
