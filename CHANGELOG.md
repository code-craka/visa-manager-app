# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-04

### Added

#### Backend
- Initial project setup for `visa-manager-backend`.
- Installed `express`, `typescript`, `pg`, `jsonwebtoken`, `bcrypt` and their respective type definitions.
- Configured `tsconfig.json` for TypeScript compilation.
- Created `src/db.ts` for PostgreSQL database connection using Neon URL.
- Implemented `src/models/User.ts` for user table creation.
- Implemented `src/models/Client.ts` for client table creation.
- Implemented `src/models/Task.ts` for task table creation, including `payment_status` column.
- Created `src/routes/auth.ts` with user registration and login endpoints.
- Created `src/routes/clients.ts` with CRUD operations for clients.
- Created `src/routes/tasks.ts` with CRUD operations for tasks, including `payment_status` in creation and update.
- Created `src/routes/notifications.ts` with endpoints for fetching and marking notifications as read.
- Created `src/routes/dashboard.ts` with agency and partner dashboard data endpoints.
- Integrated all routes (`auth`, `clients`, `tasks`, `notifications`, `dashboard`) into `src/index.ts`.
- Added `build` and `start` scripts to `package.json`.

#### Frontend
- Initial project setup for `visa_manager_frontend` using React Native.
- Installed `@react-navigation/native`, `@react-navigation/stack`, and `react-native-elements`.
- Created `src/screens/LoginScreen.tsx` with email and password input fields and a login button.
- Created `src/screens/RegistrationScreen.tsx` with name, email, password, and role input fields and a register button.
- Created `src/screens/ClientListScreen.tsx` to display a list of clients fetched from the backend.
- Created `src/screens/TaskAssignmentScreen.tsx` for assigning tasks.
- Created `src/screens/CommissionReportScreen.tsx` to display task commissions and payment statuses.
- Created `src/screens/NotificationScreen.tsx` to display user notifications and mark them as read.
- Created `src/screens/DashboardScreen.tsx` to display agency and partner specific dashboard data.
- Configured `src/navigation/AppNavigator.tsx` to manage navigation between `Login`, `Register`, `ClientList`, `TaskAssignment`, `CommissionReport`, `Notifications`, and `Dashboard` screens.
- Integrated `AppNavigator` into `App.tsx`.
- Created `src/styles/theme.ts` with a primary color (`#8D05D4`) and basic spacing/font sizes.
- Applied `ThemeProvider` from `react-native-elements` in `App.tsx`.
- Applied theme colors and spacing to `LoginScreen`, `RegistrationScreen`, `ClientListScreen`, `TaskAssignmentScreen`, `CommissionReportScreen`, `NotificationScreen`, and `DashboardScreen`.

### Fixed
- Corrected syntax errors in SQL queries within `src/routes/dashboard.ts` by properly escaping single quotes.
- Resolved TypeScript compilation errors related to module imports and `unknown` type errors by adjusting `tsconfig.json` and explicitly typing `error` objects.
