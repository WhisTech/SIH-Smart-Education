# Security & Privacy Architecture

> **Document Classification:** Information Security & Compliance Specification  
> **Standards Compliance:** MoSPI Cybersecurity Guidelines & OWASP Top 10  
> **System Status:** Active Security Architecture  

---

## 1. Authentication & Session Management

```text
User Credentials (Email/Password)
               │
               ▼
Supabase Auth Service (GoTrue)
               │
               ▼
JWT Access Token + Refresh Token Returned
               │
               ▼
Client Stores Token (Persisted Session)
               │
               ▼
Authenticated Requests (Header: `Authorization: Bearer <JWT>`)
```

### Session Handling Mechanics
1. **Authentication:** Managed via Supabase GoTrue Auth Service using secure password hashing (bcrypt/argon2).
2. **Session Persistence:** Managed on the client by `@supabase/supabase-js` using standard local storage persistence.
3. **Backend Middleware (`authenticateUser` in `server.js`):**
   * Extracts the `Authorization` Bearer token from incoming request headers.
   * Calls `supabase.auth.getUser(token)` to validate session validity directly with Supabase.
   * Attaches the authenticated user object (`req.user`) to the request context.
   * Rejects invalid or expired tokens with a `401 Unauthorized` HTTP status code.

---

## 2. Row Level Security (RLS) Architecture

Database tables in Supabase PostgreSQL enforce strict **Row Level Security (RLS)** to guarantee multi-tenant data isolation.

### Representative RLS Policies (`database/004_rls_policies.sql`, `005_assessment_schema.sql`, `006_skill_gap_schema.sql`)

#### 1. Employee Profile Isolation
```sql
CREATE POLICY "Users can manage own profile"
ON public.employee_profiles
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 2. Assessment Data Isolation
```sql
CREATE POLICY "Users can manage own assessments"
ON public.assessments
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 3. Assessment Child Table Protection (`assessment_questions`, `assessment_answers`)
```sql
CREATE POLICY "Users can manage answers of own assessments"
ON public.assessment_answers
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assessments a 
    WHERE a.id = assessment_answers.assessment_id AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assessments a 
    WHERE a.id = assessment_answers.assessment_id AND a.user_id = auth.uid()
  )
);
```

---

## 3. Secret Management & Key Exposure Prevention

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND ENVIRONMENT VARIABLES                       │
│                     (`frontend/.env` - SAFE)                           │
├────────────────────────────────────────────────────────────────────────┤
│ VITE_SUPABASE_URL=https://<project-ref>.supabase.co                    │
│ VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (Public Anon Key)                 │
│ VITE_BACKEND_URL=http://localhost:5000                                 │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                    BACKEND ENVIRONMENT VARIABLES                       │
│                   (`backend/.env` - CONFIDENTIAL)                      │
├────────────────────────────────────────────────────────────────────────┤
│ SUPABASE_URL=https://<project-ref>.supabase.co                         │
│ SUPABASE_SECRET_KEY=eyJhbGciOi... (Service Role Secret Key)            │
│ GROQ_API_KEY=gsk_... (Groq AI Model Secret Key)                       │
│ GEMINI_API_KEY=AIzaSy... (Google Gemini AI Secret Key)                │
│ PORT=5000                                                              │
└────────────────────────────────────────────────────────────────────────┘
```

> **CRITICAL SECURITY GUARANTEE:**
> Secret service keys (`SUPABASE_SECRET_KEY`), Groq API keys (`GROQ_API_KEY`), and Gemini API keys (`GEMINI_API_KEY`) are stored **ONLY in the backend environment** (`backend/.env`). They are never bundled into client-side JavaScript or exposed to the browser.

---

## 4. Input Validation & API Protection

1. **PDF File Upload Protection (`McqGenerator.jsx` & `server.js`):**
   * Configured with `multer` memory storage limited to **15 MB maximum file size**.
   * Magic byte verification (`%PDF-`) in `geminiClient.js` prevents malicious file uploads (e.g., executing scripts masked as PDF files).
2. **AI Question Deduplication Guard:**
   * Uses SHA-256 hashing (`generateFingerprint`) and text similarity checks to prevent duplicate question injection.
3. **CORS Security:**
   * Configured via `cors()` middleware in Express to prevent unauthorized cross-origin requests.
