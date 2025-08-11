import { Platform, StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenPadding: {
    padding: theme.spacing.medium,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    ...(Platform.OS === 'web' && {
      boxShadow: theme.web.shadows.small,
    }),
  },
  button: {
    minHeight: theme.accessibility.minTouchTarget,
    borderRadius: theme.borderRadius.medium,
  },
  input: {
    minHeight: theme.accessibility.minTouchTarget,
    borderRadius: theme.borderRadius.small,
  },
  text: {
    color: theme.colors.text,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.medium,
  },
  subtitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.small,
  },
  body: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  },
  error: {
    color: theme.colors.error,
    ...theme.typography.bodySmall,
  },
  success: {
    color: theme.colors.success,
    ...theme.typography.bodySmall,
  },
  // Web-specific focus styles
  ...(Platform.OS === 'web' && {
    focusable: {
      ':focus': {
        outline: theme.web.focus.outline,
        outlineOffset: theme.web.focus.outlineOffset,
      },
    },
    interactive: {
      cursor: 'pointer',
      transition: theme.web.transitions.normal,
      ':hover': {
        transform: 'translateY(-1px)',
      },
    },
  }),
});