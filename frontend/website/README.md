# 🌐 Website Frontend — SIH Smart Education Platform

Built for **SIH 2026 | Problem Statement 26101**
MoSPI / DIID / NSSTA / iGOT Karmayogi

---

## 👩‍💻 Developed by: Sayali

---

## ✅ Features Implemented

### Feature 1 — Competency Gap Analysis
- Interactive SVG Radar Chart comparing Current Score vs Role Benchmark
- Skill Gap Engine with visual gap badges (Met / Needs Training / Critical Gap)
- Score Recalibration modal
- Personalized iGOT Karmayogi course recommendations

### Feature 2 — Document-to-Quiz Engine
- Upload PDF / PPT / Text documents
- Auto-generates adaptive quiz questions from uploaded document
- Adaptive difficulty (Levels 1–3) using Item Response Theory
- Closed-loop skill radar updates after quiz completion

### Bonus — Statistical Copilot (Voice + Text AI)
- Apple-style Voice & Text AI assistant
- Covers official statistical concepts (GVA vs GDP, PPS Sampling, DPDP Act 2023)

---

## 🎨 Design System
- Apple-inspired Glassmorphism UI
- MoSPI Official Color Palette (Deep Blue, Teal, Saffron Amber)
- Rich animations with left-to-right page transitions
- Dark / Light mode toggle
- Hindi / English language switcher

---

## 📁 Folder Structure

```
website/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   ├── Header.jsx
    │   ├── HeroBento.jsx
    │   ├── CompetencyRadar.jsx
    │   ├── SkillGapEngine.jsx
    │   ├── DocQuizEngine.jsx
    │   ├── StatisticalCopilot.jsx
    │   ├── Recommendations.jsx
    │   ├── EmployeeProfileModal.jsx
    │   └── Footer.jsx
    └── data/
        └── seedData.js
```

---

## 🚀 How to Run

```bash
cd frontend/website
npm install
npm run dev
```

Open browser at: `http://localhost:5173`
