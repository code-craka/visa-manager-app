import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SecurityUtils } from '../../utils/SecurityUtils';

interface SecurityProviderProps {
  children: React.ReactNode;
}

const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Set up CSP meta tag if not already present
      const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!existingCSP) {
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.techsci.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.visamanager.com wss://ws.visamanager.com https://clerk.techsci.io; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';";
        document.head.appendChild(cspMeta);
      }

      // Generate and store CSRF token
      const csrfToken = SecurityUtils.generateCSRFToken();
      SecurityUtils.storeSecureToken('csrf_token', csrfToken);

      // Add security event listeners
      const handleBeforeUnload = () => {
        // Clear sensitive data on page unload
        SecurityUtils.removeSecureToken('auth_token');
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Clear clipboard when tab becomes hidden (security measure)
          if (navigator.clipboard) {
            navigator.clipboard.writeText('');
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;