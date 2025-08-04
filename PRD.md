Product Requirements Document (PRD)

# Objective
   The primary goal of this application is to streamline and organize the workflow and commission tracking between a visa agency and its third-party partners (individuals or companies handling tasks like fingerprinting or medical exams). This app will serve as a central hub for task assignment, progress tracking, and commission management, eliminating the need for fragmented communication channels.

## Architecture and Technology Stack
   Frontend:
Technology: React Native (with TypeScript)

Rationale: React Native is a popular and robust framework for building cross-platform mobile applications from a single codebase. Using TypeScript will ensure type safety, reduce errors, and improve code quality.

Design: A modern, clean, and user-friendly interface will be developed based on your brand's primary color, Electric Violet (#8D05D4).

Backend:

Technology: Node.js (with TypeScript)

Rationale: Node.js offers high performance, scalability, and an event-driven, non-blocking I/O model. Using TypeScript on the backend provides consistency with the frontend and enhances code maintainability.

Database:

Technology: PostgreSQL (via Neon)

Rationale: PostgreSQL is a powerful, reliable, and highly scalable relational database. Utilizing it with Neon's serverless platform allows for efficient scaling and management, suitable for projects of any size.

## Core Features
   Dashboard:

For Agencies: An overview of total clients, pending tasks, completed tasks, and total commission earnings.

For Third-Party Partners: A summary of newly assigned tasks, total completed tasks, and earned commissions.

Client & Task Management:

Agencies can create new client profiles, input visa-related information, and assign specific tasks (e.g., fingerprint, medical check-up) to third-party partners.

Third-party partners can view assigned tasks, accept or reject them, and update the task status (e.g., "in progress," "completed").

Commission & Payment Tracking:

Agencies can define a commission structure for each task.

The app will automatically track commission for completed tasks.

Both agencies and partners can view detailed reports of payments, outstanding dues, and overall commission history.

Notification System:

Real-time notifications will be sent to partners for new task assignments and to agencies for task status updates.

## 10-Day Development Plan

This plan is optimized for rapid development using AI assistance tools like Gemini and Copilot.

Days 1-2: Project Setup & Architecture

Frontend: Set up the React Native project with TypeScript. Create the basic folder structure.

Backend: Set up the Node.js project with TypeScript. Configure the connection to the PostgreSQL database via Neon.

Days 3-4: Authentication Module

Backend: Develop the user model and create API endpoints for user registration and login using JWT for authentication.

Frontend: Build the UI for the login and registration pages and integrate them with the backend APIs.

Days 5-6: Core API Functionality

Backend: Develop API endpoints for managing clients, tasks, and commission structures.

Frontend: Create UI components for client lists, task assignment pages, and task viewing pages.

Days 7-8: Commission Tracking & Notifications

Backend: Implement logic for calculating commissions and tracking payment status. Set up a basic notification system.

Frontend: Build the UI for the commission report pages and the notification panel.

Day 9: UI Refinement & Design

Frontend: Refine the entire app's UI using your brand color (#8D05D4), ensuring a consistent and aesthetic user experience.

Day 10: Testing, Bug Fixes & Deployment Prep

Perform end-to-end testing to identify and fix bugs.

Prepare the app for deployment to production environments.

