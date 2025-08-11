# React Native Web Setup

This document outlines the react-native-web configuration for the Visa Manager App.

## Dependencies Installed

### Core Dependencies
- `react-native-web@0.21.0` - React Native for web platform
- `react-dom@19.1.1` - React DOM for web rendering

### Build Dependencies
- `webpack@5.101.0` - Module bundler
- `webpack-cli@6.0.1` - Webpack command line interface
- `webpack-dev-server@5.2.2` - Development server
- `html-webpack-plugin@5.6.3` - HTML template plugin
- `babel-loader@10.0.0` - Babel loader for webpack
- `@babel/preset-react@7.27.1` - React preset for Babel

## Configuration Files

### 1. webpack.config.js
- Entry point: `index.web.js`
- React Native to web aliasing
- Babel loader configuration
- Development server setup on port 3000
- Fallbacks for incompatible modules

### 2. babel.config.js
- React Native preset
- React preset for JSX
- Loose mode plugins for compatibility

### 3. metro.config.js
- Added web platform support
- Platform resolution for web builds

### 4. App.web.tsx
- Web-specific App component
- Simplified dependencies to avoid compatibility issues
- Material Design theme integration

## Available Scripts

```bash
# Start web development server
yarn web

# Build for web production
yarn build:web

# Start web server with hot reload
yarn dev:web

# Start web server and open browser
yarn start:web
```

## Development Server

The web development server runs on:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

## Features

- ✅ React Native Web compilation
- ✅ Material Design components (React Native Paper)
- ✅ Hot reload development
- ✅ TypeScript support
- ✅ Webpack dev server with code splitting
- ✅ HTML template generation
- ✅ Cross-platform utilities (PlatformUtils, PlatformManager)
- ✅ Unified storage abstraction (localStorage/AsyncStorage)
- ✅ Cross-platform navigation (React Router/React Navigation)
- ✅ Production build optimization
- ✅ Bundle analysis support

## Known Limitations

- Expo modules are disabled for web compatibility
- React Native Elements is disabled (use React Native Paper instead)
- Some React Native specific features may not work on web
- Gesture handler has limited web support

## Next Steps

1. Gradually migrate components to be web-compatible
2. Add more React Native Paper components
3. Implement responsive design for web
4. Add web-specific optimizations
5. Configure production build optimizations

## Troubleshooting

If you encounter module resolution issues:
1. Check webpack aliases in `webpack.config.js`
2. Verify babel configuration in `babel.config.js`
3. Ensure metro config includes web platform
4. Use web-compatible alternatives for native modules