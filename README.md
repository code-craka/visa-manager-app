# Visa Manager App

## Overview

The Visa Manager App is designed to streamline and organize the workflow and commission tracking between a visa agency and its third-party partners. It serves as a central hub for task assignment, progress tracking, and commission management, aiming to eliminate fragmented communication channels.

## Features

### Core Functionality
- **User Authentication:** Secure registration and login for both agency and partner users.
- **Client Management:** Agencies can create, view, update, and delete client profiles, including visa-related information.
- **Task Management:** Agencies can assign specific tasks (e.g., fingerprint, medical check-up) to third-party partners. Partners can view, accept/reject, and update task statuses.
- **Commission Tracking:** Define commission structures for tasks, with automatic tracking of commissions for completed tasks. Detailed reports on payments, outstanding dues, and overall commission history are available.
- **Notification System:** Real-time notifications for new task assignments (to partners) and task status updates (to agencies).
- **Dashboard:** Provides an overview of key metrics for both agencies (total clients, pending/completed tasks, total commission earnings) and partners (newly assigned tasks, total completed tasks, earned commissions).

### Technology Stack

- **Frontend:** React Native (with TypeScript)
  - Cross-platform mobile application development.
  - UI/UX designed with `react-native-elements` and a custom theme using Electric Violet (`#8D05D4`) as the primary brand color.

- **Backend:** Node.js (with TypeScript)
  - High-performance, scalable API with Express.js.

- **Database:** PostgreSQL (via Neon)
  - Robust and scalable relational database solution.

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
