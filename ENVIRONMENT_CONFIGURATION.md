# Environment Configuration Guide

## Overview

This document describes the platform-specific environment configuration system implemented for cross-platform web support.

## Environment Files

### Frontend Environment Files

- **`.env`** - Default configuration with platform auto-detection
- **`.env.web`** - Web-specific configuration
- **`.env.android`** - Android-specific configuration  
- **`.env.production`** - Production deployment configuration

### Backend Environment Files

- **`.env`** - Default development configuration
- **`.env.web`** - Web backend configuration
- **`.env.android`** - Android backend configuration
- **`.env.production`** - Production backend configuration

## Platform Detection

The system automatically detects the platform and loads appropriate configuration:

```typescript
// Frontend
import EnvironmentLoader from './src/utils/EnvironmentLoader';
const config = EnvironmentLoader.getConfig();

// Backend  
import BackendEnvironmentLoader from './src/services/EnvironmentLoader';
const config = BackendEnvironmentLoader.getConfig();
```

## Build Scripts

### Frontend Scripts

```bash
# Web development
yarn dev:web

# Android development  
yarn android:env

# Production build
yarn build:production
```

### Backend Scripts

```bash
# Web backend
yarn dev:web

# Android backend
yarn dev:android

# Production
yarn start:production
```

## Configuration Variables

### Web Platform
- `REACT_APP_API_BASE_URL`: http://localhost:3000/api
- `REACT_APP_WS_URL`: ws://localhost:3001
- `REACT_APP_ENABLE_PWA`: true

### Android Platform  
- `API_BASE_URL`: http://10.0.2.2:3000/api
- `WS_URL`: ws://10.0.2.2:3001
- `ENABLE_PUSH_NOTIFICATIONS`: true

### Production
- `REACT_APP_API_BASE_URL`: https://api.visamanager.com
- `REACT_APP_WS_URL`: wss://ws.visamanager.com
- `REACT_APP_ENABLE_ANALYTICS`: true

## Usage

The environment configuration is automatically loaded based on the platform. No manual configuration is required during development or deployment.