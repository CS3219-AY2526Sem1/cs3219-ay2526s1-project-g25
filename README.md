[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# PeerPrep - Collaborative Coding Platform

PeerPrep is a real-time collaborative coding platform that pairs users to solve coding interview problems together. The system features peer matching, real-time code collaboration, AI-powered assistance, and code execution capabilities.

## Architecture

PeerPrep follows a **microservices architecture** with the following components:

### Backend Services
- **User Service** (Port 3001): Authentication, user management, and difficulty tracking
- **Question Service** (Port 5050): Question bank management with admin CRUD operations
- **Matching Service** (Port 4001): Peer matching algorithm using Redis queues
- **Collaboration Service** (Port 3004): Real-time collaboration via WebSocket, code execution, and AI assistance

### Frontend Applications
- **Login/Signup UI** (Port 3000): User authentication and dashboard
- **Matching UI** (Port 3002): Topic selection and matching interface
- **Collaboration UI** (Port 4000): Real-time code editor with collaboration features

### Infrastructure
- **PostgreSQL** (Supabase): User data and question bank storage
- **Redis**: Matching queues, session state, and temporary data

## Prerequisites

Before running the project locally, ensure you have:

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Redis** (can run via Docker or locally)
- **PostgreSQL** (via Supabase cloud or local instance)
- **Docker** (optional, for containerized setup)

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cs3219-ay2526s1-project-g25
git checkout github-actions
```

### 2. Install Dependencies

Install dependencies for all services and frontend applications:

```bash
# Backend services
cd user-service/user-service && npm install && cd ../..
cd question-service/question-service && npm install && cd ../..
cd matching-service/matching-service && npm install && cd ../..
cd collaboration-service/collaboration-service && npm install && cd ../..

# Frontend applications
cd feature-login-signup-ui/frontend && npm install && cd ../..
cd feature-matching-ui/frontend && npm install && cd ../..
cd feature-collaboration-ui/frontend/peerprep-collab && npm install && cd ../../..
```

### 3. Environment Configuration

Create `.env` files for each service by copying the `env.example` files:

```bash
# User Service
cp user-service/user-service/env.example user-service/user-service/.env

# Question Service
cp question-service/question-service/env.example question-service/question-service/.env

# Matching Service
cp matching-service/matching-service/env.example matching-service/matching-service/.env

# Collaboration Service
cp collaboration-service/collaboration-service/env.example collaboration-service/collaboration-service/.env

# Frontend applications
cp feature-login-signup-ui/frontend/env.example feature-login-signup-ui/frontend/.env
cp feature-matching-ui/frontend/env.example feature-matching-ui/frontend/.env
cp feature-collaboration-ui/frontend/peerprep-collab/env.example feature-collaboration-ui/frontend/peerprep-collab/.env
```

**Important**: Fill in all environment variables according to the `env.example` files. You'll need:
- Supabase credentials (URL and service role key)
- JWT secrets (must be identical across all services)
- Redis connection URL
- External API keys (Google AI, RapidAPI for Judge0, Cloudinary)
- Service URLs for inter-service communication

### 4. Start Infrastructure Services

#### Option A: Using Docker (Recommended)

```bash
# Start Redis
docker run -d -p 6379:6379 redis:latest
```

#### Option B: Local Redis Installation

Ensure Redis is running on `localhost:6379`

### 5. Database Setup

The services use Supabase PostgreSQL. Ensure your Supabase database is set up with the required tables:

- **User Service**: Run migrations from `user-service/user-service/migrations/init.sql`
- **Question Service**: Run schema from `question-service/question-service/db/init.sql`

## Running the Application

### Start Backend Services

Open separate terminal windows for each service:

```bash
# Terminal 1: User Service
cd user-service/user-service
npm run dev

# Terminal 2: Question Service
cd question-service/question-service
npm run dev

# Terminal 3: Matching Service
cd matching-service/matching-service
npm run dev

# Terminal 4: Collaboration Service
cd collaboration-service/collaboration-service
npm run dev
```

### Start Frontend Applications

```bash
# Terminal 5: Login/Signup UI
cd feature-login-signup-ui/frontend
npm start

# Terminal 6: Matching UI
cd feature-matching-ui/frontend
npm run dev

# Terminal 7: Collaboration UI
cd feature-collaboration-ui/frontend/peerprep-collab
npm run dev
```

### Service URLs

Once all services are running, access them at:

- **Login/Signup UI**: http://localhost:3000
- **Matching UI**: http://localhost:3002
- **Collaboration UI**: http://localhost:4000
- **User Service API**: http://localhost:3001
- **Question Service API**: http://localhost:5050
- **Matching Service API**: http://localhost:4001
- **Collaboration Service API**: http://localhost:3004

## Docker Setup (Alternative)

For a containerized setup, use Docker Compose:

```bash
# Ensure all .env files are configured
docker-compose up -d --build
```

This will start all backend services in containers. Frontend applications should still be run locally for development.

## Testing

Run tests for each service:

```bash
# User Service
cd user-service/user-service && npm test

# Question Service
cd question-service/question-service && npm test

# Matching Service
cd matching-service/matching-service && npm test

# Collaboration Service
cd collaboration-service/collaboration-service && npm test
```

## Project Structure

```
cs3219-ay2526s1-project-g25/
├── user-service/              # User authentication and management
├── question-service/          # Question bank service
├── matching-service/          # Peer matching service
├── collaboration-service/     # Real-time collaboration service
├── feature-login-signup-ui/   # Authentication frontend
├── feature-matching-ui/        # Matching interface frontend
├── feature-collaboration-ui/   # Collaboration editor frontend
├── compose.yaml               # Docker Compose configuration
```

## Key Features

- **User Authentication**: JWT-based auth with role-based access control
- **Peer Matching**: Redis-based queue system for matching users by topic and difficulty
- **Real-time Collaboration**: WebSocket-based code synchronization using Yjs
- **Code Execution**: Judge0 integration for running code in multiple languages
- **AI Assistance**: Google Gemini integration for hints and code analysis
- **Question Management**: Admin interface for CRUD operations on question bank

## Development

### Code Style

- Backend: JavaScript (ES6+) with Express.js
- Frontend: React (Login UI) and Next.js (Matching & Collaboration UIs)Is)
