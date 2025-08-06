---
inclusion: always
---

# Development Standards & Best Practices

## Code Quality Standards
- **TypeScript:** Strict mode enabled, zero compilation errors required
- **ESLint:** 95%+ compliance with React Native and Node.js best practices
- **Error Handling:** Comprehensive try-catch blocks with proper error types
- **Async/Await:** Preferred over Promises for better readability

## Authentication Standards
- **JWT Templates:** Always use Clerk JWT templates, never session tokens
- **Token Verification:** JWKS verification with RS256 algorithm required
- **Claims Structure:** Use custom claims: email, role, name
- **Error Handling:** Proper authentication error responses with status codes

## Database Standards
- **PostgreSQL:** Standard queries, no Neon serverless driver
- **RLS Policies:** Row-Level Security required for all user data
- **Migrations:** All schema changes must have migration scripts
- **Connection Pooling:** Use connection pooling for performance

## React Native Standards
- **TypeScript Interfaces:** Define interfaces for all props and state
- **Material Design:** Use React Native Paper components consistently
- **Performance:** Implement useCallback and useMemo appropriately
- **Navigation:** React Navigation 6+ with proper TypeScript types

## API Standards
- **RESTful Design:** Follow REST conventions for all endpoints
- **Status Codes:** Use appropriate HTTP status codes
- **Error Responses:** Consistent error response format
- **Validation:** Input validation on all endpoints

## File Organization
- **Backend:** src/routes/, src/models/, src/middleware/, src/services/
- **Frontend:** src/screens/, src/context/, src/services/, src/components/
- **Naming:** PascalCase for components, camelCase for functions/variables