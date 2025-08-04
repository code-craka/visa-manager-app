This document contains a high-level roadmap and specific instructions for using the Gemini CLI to build the app, following the 10-day plan.

Project Setup (Days 1–2)
Frontend:

gemini new react-native-ts-app --name visa-manager-frontend

cd visa-manager-frontend

gemini create file src/navigation/AppNavigator.tsx --component ReactNavigationStack

gemini create file src/styles/theme.ts --theme-palette #8D05D4

Backend:

gemini new node-express-ts-api --name visa-manager-backend

cd visa-manager-backend

gemini create db-connection --postgres --neon-url <psql 'postgresql://neondb_owner:npg_a2YDL1iWJdEO@ep-little-violet-a1hmcag3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'>

Authentication (Days 3–4)
Backend:

gemini create model User --fields email:string,password:string,role:string

gemini create api-auth-routes --model User --jwt

Frontend:

gemini create screen LoginScreen --ui-kit react-native-elements --form email,password --on-submit handleLogin

gemini create screen RegistrationScreen --ui-kit react-native-elements --form name,email,password,role --on-submit handleRegister

Core Functionality (Days 5–6)
Backend:

gemini create model Client --fields name:string,passport:string,visaType:string

gemini create model Task --fields client:Client, assignedTo:User, status:string, commission:number

gemini create api-crud-routes --model Client

gemini create api-crud-routes --model Task

Frontend:

gemini create screen ClientListScreen --fetch-api /api/clients --render-list

gemini create screen TaskAssignmentScreen --form client:dropdown, partner:dropdown, taskType:string, commission:number