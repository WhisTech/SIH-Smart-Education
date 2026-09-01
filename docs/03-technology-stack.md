# 03 — Technology Stack

## Technology Summary Matrix

| Layer | Technology | Version / Spec | Purpose | Evidence in Project |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | ^18.3.1 | Component-based User Interface | [package.json](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/package.json#L12) |
| **Build Tool** | Vite | ^5.4.2 | Fast HMR development & optimized asset bundling | [vite.config.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/vite.config.js) |
| **Routing** | React Router DOM | ^6.26.1 | Client-side SPA navigation & route guards | [App.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/App.jsx#L1) |
| **Icons** | Lucide React | ^0.439.0 | Scalable vector UI icons | [Layout.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/components/Layout.jsx#L4-L14) |
| **Styling** | Custom CSS3 | CSS Variables | Glassmorphism government UI design system | [index.css](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/index.css) |
| **Backend Runtime** | Node.js | v18+ | JavaScript runtime for API server | [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L1) |
| **API Framework** | Express.js | ^4.21.2 | REST API endpoints, routing & middleware | [package.json](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/package.json#L12) |
| **File Handling** | Multer | ^1.4.5-lts.1 | In-memory multipart PDF file buffer handling | [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L11-L21) |
| **PDF Parsing** | pdf-parse | ^1.1.1 | Page-by-page text extraction from uploaded PDFs | [geminiClient.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/geminiClient.js#L14-L90) |
| **Database & Auth** | Supabase JS Client | ^2.48.1 | GoTrue Auth & PostgreSQL client operations | [supabase.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/lib/supabase.js#L12-L18) |
| **Database Engine** | PostgreSQL | 15+ | Relational data storage with JSONB & RLS | [005_assessment_schema.sql](file:///c:/Z%20Github%20Project/SIH-Smart-Education/database/005_assessment_schema.sql) |
| **AI LLM Client 1** | Groq SDK | ^0.15.0 | Adaptive 1-by-1 assessment question generation (`groq/compound-mini`) | [groqClient.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/groqClient.js#L1) |
| **AI LLM Client 2** | Google Gemini API | REST Fetch | Grounded document MCQ generation (`gemini-3.6-flash`) | [geminiClient.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/geminiClient.js#L222-L268) |
| **Canvas / Rendering** | @napi-rs/canvas | ^0.1.66 | Node-native canvas rendering support | [package.json](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/package.json#L10) |
| **Research Engine** | Pure JavaScript | ES6 Classes | 4-Signal Fusion (TransE KG, Sequence, CF, Metrics) | [fusionEngine.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/research/fusionEngine.js#L11) |
| **Package Manager** | npm | Standard | Node package dependency management | `package.json` files |

---

## Dependencies & Environment Requirements

### Frontend Environment Variables (`frontend/.env`)
- `VITE_SUPABASE_URL`: Supabase project HTTPS URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase public anonymous API key.
- `VITE_BACKEND_URL`: URL of the Express backend server (default: `http://localhost:5000`).

### Backend Environment Variables (`backend/.env`)
- `PORT`: Server port (default: `5000`).
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: Supabase administrative secret key for backend database bypass.
- `GROQ_API_KEY`: API key for Groq Cloud LLM service.
- `GEMINI_API_KEY`: API key for Google Gemini API service.
