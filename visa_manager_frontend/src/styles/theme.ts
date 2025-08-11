// Material Design Theme Configuration for Visa Manager App
// Following the established Electric Violet (#8D05D4) branding

// Import the enums for use in this file
import { ClientStatus, VisaType } from '../types/Client';

export const theme = {
  colors: {
    primary: '#8D05D4', // Electric Violet - Brand Primary
    primaryContainer: '#F3E5F5',
    secondary: '#1976d2',
    secondaryContainer: '#E3F2FD',
    success: '#4caf50',
    successContainer: '#E8F5E8',
    warning: '#ff9800',
    warningContainer: '#FFF3E0',
    error: '#f44336',
    errorContainer: '#FFEBEE',
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceVariant: '#f0f0f0',
    onSurface: '#1c1b1f',
    onSurfaceVariant: '#49454f',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    outline: '#79747e',
    outlineVariant: '#cac4cf',
    text: '#1c1b1f',
    // Web-specific colors
    focus: '#8D05D4',
    hover: '#7A04B8',
    disabled: '#E0E0E0',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fontSizes: {
    small: 12,
    medium: 14,
    large: 16,
    header: 22,
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
  typography: {
    titleLarge: { fontSize: 22, fontWeight: '500' as const },
    titleMedium: { fontSize: 16, fontWeight: '500' as const },
    bodyLarge: { fontSize: 16, fontWeight: '400' as const },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const },
    bodySmall: { fontSize: 12, fontWeight: '400' as const },
    labelLarge: { fontSize: 14, fontWeight: '500' as const },
    labelMedium: { fontSize: 12, fontWeight: '500' as const },
    labelSmall: { fontSize: 11, fontWeight: '500' as const },
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
  },
  elevation: {
    level0: 0,
    level1: 1,
    level2: 3,
    level3: 6,
    level4: 8,
    level5: 12,
  },
  // Web-specific styles
  web: {
    transitions: {
      fast: '0.15s ease',
      normal: '0.2s ease',
      slow: '0.3s ease',
    },
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.12)',
      medium: '0 4px 6px rgba(0,0,0,0.1)',
      large: '0 10px 25px rgba(0,0,0,0.15)',
    },
    focus: {
      outline: '2px solid #8D05D4',
      outlineOffset: '2px',
    },
  },
  // Accessibility
  accessibility: {
    minTouchTarget: 44,
    focusRingWidth: 2,
    highContrast: {
      primary: '#6A0DAD',
      background: '#FFFFFF',
      text: '#000000',
    },
  },
};

// Status color mapping for visual consistency
export const statusColors = {
  [ClientStatus.PENDING]: '#FFF3CD',
  [ClientStatus.IN_PROGRESS]: '#D1ECF1',
  [ClientStatus.DOCUMENTS_REQUIRED]: '#F8D7DA',
  [ClientStatus.UNDER_REVIEW]: '#D4EDDA',
  [ClientStatus.APPROVED]: '#D4EDDA',
  [ClientStatus.REJECTED]: '#F8D7DA',
  [ClientStatus.COMPLETED]: '#D4EDDA',
};

// Visa type icon mapping for visual identification
export const visaTypeIcons = {
  [VisaType.TOURIST]: 'camera',
  [VisaType.BUSINESS]: 'briefcase',
  [VisaType.STUDENT]: 'school',
  [VisaType.WORK]: 'hammer',
  [VisaType.FAMILY]: 'account-group',
  [VisaType.TRANSIT]: 'airplane',
};
