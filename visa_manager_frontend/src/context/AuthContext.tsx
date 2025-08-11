import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import { ClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { SecurityUtils } from '../utils/SecurityUtils';
import { CORSService } from '../services/CORSService';

interface User {
  id: string;
  email: string;
  displayName: string;
  role?: 'agency' | 'partner';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => void;
  signUp: () => void;
  signOut: () => Promise<void>;
  syncUserWithBackend: (role: 'agency' | 'partner') => Promise<{ success: boolean; }>;
  getAuthToken: () => Promise<string | null>;
  showSignIn: boolean;
  showSignUp: boolean;
  setShowSignIn: (show: boolean) => void;
  setShowSignUp: (show: boolean) => void;
  // Security features
  enableMFA: () => Promise<boolean>;
  disableMFA: () => Promise<boolean>;
  isMFAEnabled: boolean;
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

// Real Clerk auth provider
const AuthProviderInner: React.FC<AuthProviderProps> = ({ children }) => {
  const { isSignedIn, signOut: clerkSignOut, getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);

  // Use static API URL for Android emulator
  const apiBaseUrl = 'http://10.0.2.2:3000/api';

  const checkAuthState = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isSignedIn && clerkUser && isLoaded) {
        // User is authenticated with Clerk
        const token = await getToken();

        if (token) {
          // Get JWT template token
          const jwtToken = await getToken({ template: 'neon' });

          if (jwtToken) {
            // Try to sync with backend
            try {
              const headers = {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json',
                ...(Platform.OS === 'web' ? CORSService.getCORSHeaders() : {}),
              };

              const response = await fetch(`${apiBaseUrl}/auth/profile`, {
                headers,
                credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
              });

              if (response.ok) {
                const userData = await response.json();
                setUser({
                  id: clerkUser.id,
                  email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com',
                  displayName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
                  role: userData.user?.role || clerkUser.unsafeMetadata?.role as 'agency' | 'partner',
                });
              } else {
                // Backend sync failed, but user is still authenticated with Clerk
                setUser({
                  id: clerkUser.id,
                  email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com',
                  displayName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
                  role: clerkUser.unsafeMetadata?.role as 'agency' | 'partner' || 'partner',
                });
              }
            } catch (networkError) {
              console.warn('Backend connection failed, using Clerk data only:', networkError);
              // Still set user from Clerk even if backend is unreachable
              setUser({
                id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com',
                displayName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
                role: clerkUser.unsafeMetadata?.role as 'agency' | 'partner' || 'partner',
              });
            }
          } else {
            console.warn('Failed to get JWT template token');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkUser, isLoaded, getToken, apiBaseUrl]);

  useEffect(() => {
    if (isLoaded) {
      checkAuthState();
    }
  }, [checkAuthState, isLoaded]);

  const signIn = () => {
    setShowSignIn(true);
    setShowSignUp(false);
  };

  const signUp = () => {
    setShowSignUp(true);
    setShowSignIn(false);
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await clerkSignOut();
      setUser(null);
      setShowSignIn(false);
      setShowSignUp(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncUserWithBackend = async (role: 'agency' | 'partner') => {
    try {
      // Update user metadata in Clerk first
      if (clerkUser) {
        await clerkUser.update({
          unsafeMetadata: { role }
        });
      }

      // Get JWT template token with updated metadata
      const jwtToken = await getToken({ template: 'neon' });
      if (!jwtToken) {
        throw new Error('No JWT token available');
      }

      const response = await fetch(`${apiBaseUrl}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user with backend');
      }

      const userData = await response.json();

      // Update user state with role
      setUser(prev => prev ? { ...prev, role: userData.user?.role || role } : null);

      return { success: true };
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (isSignedIn) {
      const token = await getToken({ template: 'neon' });
      if (token) {
        // Store token securely
        await SecurityUtils.storeSecureToken('auth_token', token);
      }
      return token;
    }
    return null;
  };

  const enableMFA = async (): Promise<boolean> => {
    try {
      if (clerkUser) {
        // Enable MFA through Clerk
        await clerkUser.update({
          unsafeMetadata: { 
            ...clerkUser.unsafeMetadata,
            mfaEnabled: true 
          }
        });
        setIsMFAEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable MFA:', error);
      return false;
    }
  };

  const disableMFA = async (): Promise<boolean> => {
    try {
      if (clerkUser) {
        await clerkUser.update({
          unsafeMetadata: { 
            ...clerkUser.unsafeMetadata,
            mfaEnabled: false 
          }
        });
        setIsMFAEnabled(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      return false;
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
    showSignIn,
    showSignUp,
    setShowSignIn,
    setShowSignUp,
    enableMFA,
    disableMFA,
    isMFAEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Main provider with real Clerk
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey="pk_live_Y2xlcmsudGVjaHNjaS5pbyQ"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#8D05D4',
        }
      }}
    >
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </ClerkProvider>
  );
};

export default AuthProvider;