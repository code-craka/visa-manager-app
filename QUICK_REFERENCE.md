# Visa Manager App - Quick Reference Guide

## 🚀 Quick Start Commands

### Start Backend Server

```bash
cd visa-manager-backend
npm start  # Runs on http://localhost:3000
```

### Start Frontend Metro Bundler  

```bash
cd visa_manager_frontend
npm start  # Runs on http://localhost:8081
```

## 📋 Current Status

- ✅ Backend: 0 TypeScript errors, fully operational
- ✅ Frontend: 0 TypeScript errors, Metro bundler running
- ✅ Database: Neon PostgreSQL connected
- ✅ Authentication: Working mock system with backend integration

## 🔐 Authentication Files

- `AuthContext.tsx` - Current working version (mock auth)
- `AuthContext_original.tsx` - Original Stack Auth implementation
- `AuthContext_working.tsx` - Development backup

## 🎯 Next Session Priorities

1. End-to-end testing of complete user flows
2. Implement real-time WebSocket features
3. Complete UI/UX testing across all screens
4. Finalize authentication system (Stack Auth vs mock)
5. Production deployment preparation

## 📱 Tech Stack

- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React Native + TypeScript + React Native Paper
- **Database**: Neon PostgreSQL Cloud
- **Auth**: Stack Auth (preserved) + Mock system (active)

## 🔧 Environment Setup

Backend `.env` configured with:

- PORT=3000
- NODE_ENV=development  
- Stack Auth credentials
- Neon database URL

*Ready for production-level development and testing!*
