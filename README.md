# Visa Manager App

## Overview

The Visa Manager App is a comprehensive mobile and web application designed to streamline and organize the workflow and commission tracking between visa agencies and their third-party partners. It serves as a central hub for task assignment, real-time progress tracking, and commission management, eliminating fragmented communication channels.

## ✨ Latest Features (v0.2.0)

### 🔴 Real-time Capabilities
- **Live WebSocket Communication** - Instant notifications and updates
- **Real-time Dashboard** - Live statistics and connection status
- **Notification System** - Unread count tracking and click-to-navigate

### 🎨 Enhanced User Interface
- **Material Design Components** - Modern UI with React Native Paper
- **Advanced Task Assignment** - Dual modes for new/existing task management
- **Smart Client Management** - Search, filter, and sort with statistics
- **Priority Management** - Color-coded priority levels and status indicators

### ⚡ Performance Optimizations
- **Efficient State Management** - Optimized React patterns with proper hooks
- **Memory Management** - WebSocket cleanup and async operation handling
- **Type Safety** - Comprehensive TypeScript implementation

## Features

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

- **Frontend:** React Native (with TypeScript)
  - Cross-platform mobile application development
  - UI/UX designed with React Native Paper (Material Design)
  - Real-time WebSocket integration
  - Custom theme with Electric Violet (`#8D05D4`) primary color

- **Backend:** Node.js (with TypeScript)
  - High-performance, scalable API with Express.js
  - WebSocket server for real-time communication
  - Comprehensive error handling and logging

- **Database:** PostgreSQL (via Neon)
  - Robust and scalable relational database solution
  - Optimized with proper indexing for performance

- **Real-time:** WebSocket
  - Auto-reconnection with exponential backoff
  - Event-driven architecture for live updates
  - Connection state management

## Architecture

### Frontend Architecture
```
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
```
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
- npm (Node Package Manager)
- PostgreSQL database (Neon recommended)
- React Native development environment setup (Android Studio/Xcode)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/code-craka/visa-manager-app.git
    cd visa-manager-app
    ```

2.  **Backend Setup:**
    ```bash
    cd visa-manager-backend
    npm install
    # Create a .env file and add your Neon PostgreSQL connection string
    # DATABASE_URL="your_neon_connection_string"
    npm run build
    npm start
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../visa_manager_frontend
    npm install
    # Link native dependencies (for iOS)
    npx pod-install
    # Run on Android or iOS emulator/device
    npm run android # or npm run ios
    ```

## Project Structure

```
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
    │   ├── screens/ (LoginScreen, RegistrationScreen, ClientListScreen, TaskAssignmentScreen, CommissionReportScreen, NotificationScreen, DashboardScreen)
    │   └── styles/ (theme.ts)
    ├── App.tsx
    ├── package.json
    ├── tsconfig.json
    └── ...
```

## Contributing

Contributions are welcome! Please see `CONTRIBUTING.md` (if available) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Sayem Abdullah Rihan
GitHub: [code-craka](https://github.com/code-craka)
