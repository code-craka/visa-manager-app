import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StackClientApp } from '@stackframe/react';

// Initialize Stack client with your configuration
const stack = new StackClientApp({
  projectId: 'cda3af03-3de4-4571-be6c-479330bb1693',
  publishableClientKey: 'pck_gmnz9j1f8r4hpr6jw2gnrqqn74zrm85913zr0vz3sxz8g',
});

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

  // Backend API base URL - adjust this to your backend URL
  const API_BASE_URL = 'http://localhost:3000/api';

  useEffect(() => {
    // Check if user is already logged in when the app starts
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const currentUser = stack.getUser();
      
      if (currentUser) {
        // Get additional user data from backend
        const token = await getAuthToken();
        if (token) {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: currentUser.id,
              email: currentUser.primaryEmail || '',
              displayName: currentUser.displayName || currentUser.primaryEmail || '',
              role: userData.role,
            });
          } else {
            // User exists in Neon Auth but not in backend, clear auth
            await signOut();
          }
        } else {
          setUser({
            id: currentUser.id,
            email: currentUser.primaryEmail || '',
            displayName: currentUser.displayName || currentUser.primaryEmail || '',
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await stack.signInWithPassword({ email, password });
      await checkAuthState();
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
      await stack.signUpWithPassword({ 
        email, 
        password,
        displayName 
      });
      await checkAuthState();
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
      await stack.signOut();
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
    try {
      const currentUser = stack.getUser();
      if (!currentUser) return null;
      
      return await currentUser.getAccessToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
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

export { stack };
