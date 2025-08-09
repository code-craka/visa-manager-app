# Visa Manager App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.80.2-blue?logo=react)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![Yarn](https://img.shields.io/badge/Yarn-v1.22.x-blue?logo=yarn)](https://classic.yarnpkg.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue?logo=postgresql)](https://www.postgresql.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?logo=github)](https://github.com/code-craka/visa-manager-app)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-Excellent-brightgreen?logo=codeclimate)](https://github.com/code-craka/visa-manager-app)
[![Version](https://img.shields.io/badge/Version-0.3.1-blue?logo=semver)](https://github.com/code-craka/visa-manager-app/releases)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey?logo=mobile)](https://github.com/code-craka/visa-manager-app)
[![WebSocket](https://img.shields.io/badge/Real--time-WebSocket-orange?logo=socket.io)](https://github.com/code-craka/visa-manager-app)
[![Material Design](https://img.shields.io/badge/UI-Material%20Design-blue?logo=material-design)](https://material.io/)
[![Zero Duplicates](https://img.shields.io/badge/Duplicates-Zero-brightgreen?logo=checkmarx)](https://github.com/code-craka/visa-manager-app)

## Overview

The Visa Manager App is a comprehensive mobile and web application designed to streamline and organize the workflow and commission tracking between visa agencies and their third-party partners. It serves as a central hub for task assignment, real-time progress tracking, and commission management, eliminating fragmented communication channels.

## ✨ Latest Updates

### 🚀 Version 0.3.1 (Current) - August 9, 2025

- **🌐 Complete Client Management API** - Full REST API with 7 endpoints and authentication
- **🏗️ Client Service Layer** - Complete backend ClientService implementation with CRUD operations
- **✅ Comprehensive Testing** - 23 passing unit tests for ClientService with full coverage
- **🔍 Advanced Validation** - Input validation schema with custom error handling
- **📊 Statistics & Pagination** - Client statistics, filtering, sorting, and pagination support
- **🛡️ Error Handling** - Custom ClientError classes with proper status codes and API responses
- **🔒 Row-Level Security** - RLS enforcement for all client operations with role-based access
- **📱 Complete Client Management UI** - ClientListScreen and ClientFormScreen with Material Design
- **🔍 Advanced Search & Filtering** - Debounced search, status filters, sorting, and pagination
- **📝 Form Validation** - Real-time client form validation with comprehensive error handling
- **🗑️ Enhanced Delete Operations** - Smart client deletion with active task validation and detailed error messages
- **🎯 Production Ready** - Zero TypeScript errors, comprehensive documentation, and testing

### 🔐 Version 0.3.0 - JWT Template Integration

- **🔐 JWT Template Integration** - Migrated from Stack Auth to Clerk with JWT templates
- **🧹 Major Codebase Cleanup** - Removed all unused/old files and dependencies
- **✅ Zero TypeScript Errors** - Complete frontend and backend compilation success
- **🔧 Authentication Overhaul** - Implemented JWKS verification with custom claims
- **📊 Database Migration** - Updated from Stack Auth to Clerk user IDs with RLS
- **🎯 Performance Optimization** - JWT templates for better token performance
- **📚 Documentation Update** - Comprehensive docs with latest architecture changes

### 🔴 Version 0.2.0 - Real-time & Material Design

- **Live WebSocket Communication** - Instant notifications and updates
- **Real-time Dashboard** - Live statistics and connection status
- **Material Design Components** - Modern UI with React Native Paper
- **Advanced Task Assignment** - Dual modes for new/existing task management
- **Smart Client Management** - Search, filter, and sort with statistics

## 📊 Project Status

| Component | Status | Coverage | Implementation | Details |
|-----------|--------|----------|----------------|---------|
| **Frontend** | ✅ Active | 95% | React Native + TypeScript | Material Design UI |
| **Backend** | ✅ Active | 98% | Node.js + Express | RESTful API |
| **Database** | ✅ Connected | 100% | PostgreSQL (Neon) | RLS Enabled |
| **Authentication** | ✅ Working | JWT Templates | Clerk + JWKS | Production Ready |
| **Client Management** | ✅ Complete | Full CRUD | 7 API Endpoints | Service Layer |
| **Build System** | ✅ Passing | TypeScript | Zero Errors | Optimized |
| **Code Quality** | ✅ Excellent | Comprehensive | Testing + Validation | Clean Architecture |

### 🎯 Key Metrics

- **Total Files**: 35+ TypeScript/JavaScript files
- **Code Quality**: Zero TypeScript compilation errors maintained
- **Build Status**: ✅ Production ready with comprehensive testing
- **Test Coverage**: 23 passing unit tests for client management with enhanced deletion testing
- **API Endpoints**: 25+ RESTful endpoints with authentication
- **Documentation**: Comprehensive with 15+ markdown files
- **Client Management**: Complete CRUD with advanced features and smart deletion

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/sync-user` | Sync user with backend | ✅ Active |
| `GET` | `/api/auth/profile` | Get user profile | ✅ Active |
| `GET` | `/api/auth/users` | Get all users (agency only) | ✅ Active |
| `GET` | `/api/test/jwt-test` | JWT template integration test | ✅ Active |

### Client Management (Complete Implementation)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/clients` | List all clients with filtering/pagination | ✅ Complete |
| `POST` | `/api/clients` | Create new client (agency only) | ✅ Complete |
| `GET` | `/api/clients/:id` | Get client details | ✅ Complete |
| `PUT` | `/api/clients/:id` | Update client (agency only) | ✅ Complete |
| `DELETE` | `/api/clients/:id` | Delete client with active task validation (agency only) | ✅ Complete |
| `GET` | `/api/clients/stats` | Get client statistics (agency only) | ✅ Complete |
| `GET` | `/api/clients/for-assignment` | Get clients for task assignment | ✅ Complete |

### Task Management

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/tasks` | List tasks | ✅ Active |
| `POST` | `/api/tasks` | Create task | ✅ Active |
| `GET` | `/api/tasks/:id` | Get task details | ✅ Active |
| `PUT` | `/api/tasks/:id` | Update task | ✅ Active |
| `POST` | `/api/tasks/:id/assign` | Assign task | ✅ Active |
| `GET` | `/api/tasks/partner/:partnerId/commission-report` | Get commission report | ✅ Active |

### Dashboard & Analytics

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/dashboard/agency` | Agency dashboard data | ✅ Active |
| `GET` | `/api/dashboard/partner` | Partner dashboard data | ✅ Active |
| `GET` | `/api/dashboard/analytics` | Analytics data (agency only) | ✅ Active |

### Notifications

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/notifications` | Get all notifications | ✅ Active |
| `GET` | `/api/notifications/unread/count` | Get unread count | ✅ Active |
| `POST` | `/api/notifications` | Create notification | ✅ Active |
| `PUT` | `/api/notifications/:id/read` | Mark as read | ✅ Active |
| `PUT` | `/api/notifications/read-all` | Mark all as read | ✅ Active |
| `DELETE` | `/api/notifications/:id` | Delete notification | ✅ Active |

### Real-time Events

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `connection` | Client → Server | WebSocket connection | Connection ID |
| `taskUpdate` | Server → Client | Task status change | Task object |
| `notification` | Server → Client | New notification | Notification object |
| `userOnline` | Bidirectional | User status change | User ID + status |

## 📱 Features

### Core Functionality

- **User Authentication:** Secure registration and login for both agency and partner users
- **Client Management:** Agencies can create, view, update, and delete client profiles with visa information
- **Task Management:** Advanced task assignment system with dual modes:
  - **New Task Creation:** Full form with priority levels, commission, and deadlines
  - **Existing Task Assignment:** Select from pending tasks with status indicators
- **Commission Tracking:** Define commission structures with automatic tracking and detailed reports
- **Real-time Notification System:** Live notifications for task assignments and status updates
- **Advanced Dashboard:** Comprehensive overview with live statistics and real-time updates

### Technology Stack

#### 🎨 Frontend Stack

- **Framework:** React Native 0.80.2 (TypeScript)
  - Cross-platform mobile application (iOS & Android)
  - UI/UX designed with React Native Paper (Material Design)
  - Real-time WebSocket integration for live updates
  - Custom theme with Electric Violet (`#8D05D4`) primary color
  - Navigation with React Navigation 7.x
  - State management with React Context API

#### ⚡ Backend Stack

- **Runtime:** Node.js 18.x (TypeScript)
  - High-performance Express.js API server
  - WebSocket server for real-time communication
  - JWT authentication with Clerk integration and JWKS verification
  - Comprehensive error handling and logging
  - RESTful API design with proper HTTP status codes

#### 🗄️ Database & Infrastructure

- **Database:** PostgreSQL 15.x (Neon Cloud)
  - Robust relational database with optimized indexing
  - Cloud-hosted for scalability and reliability
  - Connection pooling and query optimization
  - ACID compliance for data integrity

#### 🔗 Real-time & Communication

- **WebSocket:** Socket.io compatible
  - Auto-reconnection with exponential backoff
  - Event-driven architecture for live updates
  - Connection state management and heartbeat
  - Real-time notifications and status updates

#### 🛠️ Development Tools

- **Build System:** TypeScript 4.9.5 with strict mode
- **Package Manager:** Yarn v1 (1.22.x) with yarn.lock versioning
- **Code Quality:** ESLint + Prettier configuration
- **Testing:** Jest framework for unit and integration tests
- **Version Control:** Git with semantic versioning

## Architecture

### Frontend Architecture

``` markdown
visa_manager_frontend/
├── src/
│   ├── services/
│   │   ├── ApiService.ts          # API communication layer
│   │   └── WebSocketService.ts    # Real-time communication
│   ├── context/
│   │   ├── AuthContext.tsx        # Authentication state
│   │   └── RealtimeContext.tsx    # Real-time state management
│   ├── screens/
│   │   ├── DashboardScreen.tsx    # Live dashboard with stats
│   │   ├── ClientListScreen.tsx   # Enhanced client management
│   │   ├── TaskAssignmentScreen.tsx # Advanced task assignment
│   │   ├── LoginScreen.tsx        # Authentication
│   │   └── ...                    # Other screens
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Navigation structure
│   └── styles/
│       └── theme.ts               # Consistent theming
```

### Backend Architecture

``` markdown
visa-manager-backend/
├── src/
│   ├── models/                    # Database models
│   ├── routes/                    # API endpoints
│   ├── middleware/                # Authentication & validation
│   ├── websocket/                 # Real-time server
│   ├── db.ts                      # Database connection
│   └── index.ts                   # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (>=18)
- Yarn v1 (1.22.x) - Install globally: `npm install -g yarn@1.22.x`
- PostgreSQL database (Neon recommended)
- React Native development environment setup (Android Studio/Xcode)

**Verify Yarn Installation:**
```bash
yarn --version  # Should show 1.22.x
```

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/code-craka/visa-manager-app.git
    cd visa-manager-app
    ```

2. **Backend Setup:**

    ```bash
    cd visa-manager-backend
    yarn install
    # Create a .env file and add your Neon PostgreSQL connection string
    # DATABASE_URL="your_neon_connection_string"
    yarn build
    yarn start
    ```

3. **Frontend Setup:**

    ```bash
    cd ../visa_manager_frontend
    yarn install
    # Link native dependencies (for iOS)
    npx pod-install
    # Run on Android or iOS emulator/device
    yarn android # or yarn ios
    ```

## Project Structure

```markdown
visa-manager-app/
├── visa-manager-backend/
│   ├── src/
│   │   ├── db.ts
│   │   ├── index.ts
│   │   ├── models/ (User, Client, Task, Notification)
│   │   └── routes/ (auth, clients, tasks, notifications, dashboard)
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
└── visa_manager_frontend/
    ├── src/
    │   ├── navigation/ (AppNavigator)
    │   ├── screens/ (LoginScreen, RegistrationScreen, ClientListScreen, ClientFormScreen, TaskAssignmentScreen, CommissionReportScreen, NotificationScreen, DashboardScreen)
    │   └── styles/ (theme.ts)
    ├── App.tsx
    ├── package.json
    ├── tsconfig.json
    └── ...
```

## 📚 Documentation

### Project Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples and cURL samples
- **[PROJECT_STATUS_SUMMARY.md](./PROJECT_STATUS_SUMMARY.md)** - Current implementation status and roadmap
- **[CHANGELOG.md](./CHANGELOG.md)** - Detailed version history and changes
- **[PRD.md](./PRD.md)** - Product Requirements Document with implementation status
- **[RELEASE_NOTES.md](./RELEASE_NOTES.md)** - Comprehensive release information
- **[VERSION_CONTROL.md](./VERSION_CONTROL.md)** - Git workflow and tagging strategy

### 📖 Quick Reference

- **Current Version:** v0.3.1 (Complete Client Management System)
- **Previous Version:** v0.3.0 (JWT Template Integration)
- **Git Tags:** `v0.3.1`, `v0.3.0`, `v0.2.3`, `v0.2.2`, `v0.2.1`
- **Package Manager:** Yarn v1 (1.22.x) - `yarn --version`
- **Build Status:** ✅ Successful (0 TypeScript errors)
- **API Endpoints:** 25+ RESTful endpoints with authentication
- **Test Coverage:** 23 passing unit tests for client management with enhanced deletion testing
- **Platform Support:** iOS 11.0+ | Android API 21+
- **Node.js Version:** 18.x LTS
- **Database:** PostgreSQL 15.x (Neon Cloud)

### 🚀 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/code-craka/visa-manager-app.git
cd visa-manager-app

# Backend setup
cd visa-manager-backend && yarn install && yarn build && yarn start

# Frontend setup (new terminal)
cd visa_manager_frontend && yarn install && yarn android
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Setting up the development environment with Yarn v1
- Running the application and available scripts  
- Code quality standards and testing requirements
- Git workflow and commit conventions
- Package management best practices

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Sayem Abdullah Rihan
GitHub: [code-craka](https://github.com/code-craka)
