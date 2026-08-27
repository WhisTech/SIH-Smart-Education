# Welcome to SIH
# SIH Smart Education

AI-enabled learning and competency development platform for India's Official Statistical System.

The platform is designed to identify employee competency gaps, recommend personalized learning, support assessments, and strengthen capacity building.

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* Supabase JavaScript Client

### Backend

* Node.js
* Express.js
* JavaScript

### Database and Authentication

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security (RLS)

### Future AI Components

AI/ML components will be added only where they provide clear value, such as adaptive assessments, competency analysis, personalized recommendations, and learning-content generation.

## Project Structure

```text
SIH-Smart-Education/
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── .env.local
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── ...
│
├── database/
│   ├── README.md
│   └── SQL migration files
│
├── docs/
│   └── project documentation
│
├── .gitignore
└── README.md
```

## Features

### Feature 1 — Competency Assessment and Skill Gap Identification

The first feature covers:

```text
Employee Profile
        ↓
Competency Assessment
        ↓
Competency Score
        ↓
Required vs Current Competency
        ↓
Skill Gap Report
```

The employee profile includes:

* Name
* Department
* Designation
* Job Role
* Current Assignment
* Education
* Experience
* Previous Training

The system will compare employee competencies against the predefined competency framework and identify skill gaps.

## Supabase Setup

The project uses a shared Supabase project.

All developers must use their own Supabase account.

### Supabase Team Access

Each developer must:

1. Have their own Supabase account.
2. Be invited to the project by the project administrator.
3. Accept the project invitation.
4. Access the shared Supabase project using their own account.

**Never share your Supabase account password with another developer.**

## Environment Variables

Environment files contain project credentials and must never be committed to Git.

Every developer must create their own local environment files after cloning the repository.

### Frontend Environment

Go to:

```text
frontend/
```

Create:

```text
.env.local
```

Add:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Each developer must create this file on their own computer.

Do not copy `.env.local` through GitHub.

Do not commit `.env.local`.

The frontend uses the Supabase publishable key. This key is intended for client-side use, while database security is enforced through authentication and Row Level Security.

### Backend Environment

Go to:

```text
backend/
```

Create:

```text
.env
```

Add:

```env
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
PORT=5000
```

The backend secret key must remain on the backend/server only.

**Never put `SUPABASE_SECRET_KEY` in the React frontend.**

**Never commit the backend `.env` file.**

## Initial Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd SIH-Smart-Education
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Create frontend environment file

Create:

```text
frontend/.env.local
```

Add the Supabase project URL and publishable key provided for the project.

### 4. Start frontend

```bash
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

### 5. Install backend dependencies

Open another terminal:

```bash
cd SIH-Smart-Education/backend
npm install
```

### 6. Create backend environment file

Create:

```text
backend/.env
```

Add the required backend Supabase credentials.

### 7. Start backend

```bash
npm run dev
```

The backend runs by default at:

```text
http://localhost:5000
```

### 8. Test backend

Open:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Backend is running"
}
```

## Database

The project uses Supabase PostgreSQL.

Database changes are stored as SQL files inside:

```text
database/
```

SQL files should be numbered according to their execution order.

Example:

```text
database/
├── 001_employee_profiles.sql
├── 002_competency_framework.sql
├── 003_assessments.sql
└── ...
```

Database changes must be tested in Supabase before being committed to Git.

Do not store passwords, API keys, secret keys, or other credentials in the `database/` directory.

## Security Rules

The following rules are mandatory:

* Never share personal Supabase passwords.
* Never commit `.env` files.
* Never commit `.env.local` files.
* Never commit Supabase secret keys.
* Never put the Supabase secret key in the frontend.
* Never disable Row Level Security just to solve an application error.
* Use Supabase Authentication for user identity.
* Use RLS policies to protect user data.
* Do not hard-code credentials in source code.
* Do not upload credentials to GitHub.

## Git Workflow

The `main` branch contains the stable version of the project.

Developers should not directly push unfinished work to `main`.

Recommended workflow:

```text
main
 │
 ├── feature/frontend-employee-profile
 ├── feature/backend-employee-profile
 ├── feature/database-competency
 ├── feature/assessment
 └── feature/skill-gap
```

### Create a feature branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Commit changes

```bash
git add .
git commit -m "Add employee profile form"
```

### Push the branch

```bash
git push -u origin feature/your-feature-name
```

### Pull Request

After completing the work:

1. Push the feature branch.
2. Create a Pull Request on GitHub.
3. Explain what was changed.
4. Test the changes.
5. Get the required review.
6. Merge into `main`.

## Important Team Rule

Before starting development:

```text
Pull latest main
      ↓
Create feature branch
      ↓
Create your own local .env files
      ↓
Develop
      ↓
Test
      ↓
Commit
      ↓
Push branch
      ↓
Pull Request
      ↓
Review
      ↓
Merge
```

Never commit your personal `.env` or `.env.local` files.

## Current Development Status

### Project Setup

* [x] React/Vite frontend
* [x] Node.js/Express backend
* [x] Supabase project
* [x] Supabase frontend connection
* [x] Supabase backend connection
* [x] Supabase Authentication test
* [x] Row Level Security
* [x] Employee profile database table
* [x] User profile ownership using `user_id`

### Feature 1

* [x] Employee profile database foundation
* [ ] Complete employee profile form
* [ ] Competency framework
* [ ] Required competency profile
* [ ] Competency assessment
* [ ] Competency scoring
* [ ] Skill-gap calculation
* [ ] Skill-gap report

## Development Principle

Build the simplest reliable version first.

AI should be introduced only when it provides a measurable advantage over rule-based or traditional approaches.

The system should prioritize:

* Security
* Reliability
* Maintainability
* Scalability
* User experience
* Measurable competency outcomes
