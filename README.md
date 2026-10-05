# AI Health & Wellness Tracking System

A MERN starter project for a final-year B.Tech CSE project.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT + bcryptjs
- AI: Provider-agnostic LLM service placeholder
- Charts: Recharts

## Features included
- User registration/login
- JWT authentication
- Health profile
- Goal modes: gain / lose / maintain
- BMI + BMR + estimated TDEE calculations
- Health-condition profile
- AI wellness-plan endpoint with a safe mock fallback
- Dashboard
- Weight tracking
- Progress chart
- Meal/exercise plan display
- AI chat endpoint
- Basic safety guardrails

## Important
This is a software project starter, not a medical device or diagnostic system. Do not present generated content as medical diagnosis or treatment. For users with significant medical conditions, the UI should encourage consultation with a qualified professional.

## Setup

### 1. Backend
```bash
cd backend
npm install
copy .env.example .env
```
Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai_health_wellness
JWT_SECRET=replace_with_a_long_random_secret
LLM_PROVIDER=mock
LLM_API_KEY=
LLM_MODEL=
```

Start:
```bash
npm run dev
```

### 2. Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Switching to a real LLM
The backend has a provider-agnostic service at:
`backend/src/services/llmService.js`

Keep the API key only in the backend `.env`. Never expose it in React/Vite environment variables.

## Suggested next development phases
1. Improve UI/UX
2. Add food/exercise collections
3. Add calorie/macronutrient calculations
4. Add daily logs
5. Add notifications
6. Add admin dashboard
7. Add RAG over a curated nutrition/exercise knowledge base
8. Add structured LLM output validation
9. Add tests and deployment
