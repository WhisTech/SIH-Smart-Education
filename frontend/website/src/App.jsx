import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBento from './components/HeroBento';
import CompetencyRadar from './components/CompetencyRadar';
import SkillGapEngine from './components/SkillGapEngine';
import Recommendations from './components/Recommendations';
import DocQuizEngine from './components/DocQuizEngine';
import StatisticalCopilot from './components/StatisticalCopilot';
import EmployeeProfileModal from './components/EmployeeProfileModal';
import Footer from './components/Footer';
import { INITIAL_EMPLOYEE } from './data/seedData';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [employee, setEmployee] = useState(INITIAL_EMPLOYEE);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen relative ${darkMode ? 'dark-mode' : ''}`}>
      
      {/* Ambient background lighting orbs */}
      <div className="ambient-bg">
        <div className="ambient-blob-1"></div>
        <div className="ambient-blob-2"></div>
        <div className="ambient-blob-3"></div>
      </div>

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        employee={employee}
        setEmployee={setEmployee}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        lang={lang}
        setLang={setLang}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Application Dedicated Full Page Views with Apple Glide Transitions */}
      <main className="relative z-10 px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-8">
        
        {/* VIEW 1: MASTER DASHBOARD & COMPETENCY RADAR (Feature 1 Overview) */}
        {activeTab === 'overview' && (
          <div key="tab-overview" className="space-y-8 apple-page-enter">
            <HeroBento
              employee={employee}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onRunAssessment={() => setActiveTab('matrix')}
              onUploadDoc={() => setActiveTab('quiz')}
              onOpenCopilot={() => setActiveTab('copilot')}
              onViewPathways={() => setActiveTab('pathways')}
              lang={lang}
            />

            <CompetencyRadar
              employee={employee}
              onRunAssessment={() => setActiveTab('matrix')}
              onNavigateToPathways={() => setActiveTab('pathways')}
              lang={lang}
            />
          </div>
        )}

        {/* VIEW 2: DEDICATED FULL-PAGE SKILL-GAP MATRIX & RECALIBRATION */}
        {activeTab === 'matrix' && (
          <div key="tab-matrix" className="space-y-6 apple-page-enter">
            <SkillGapEngine
              employee={employee}
              setEmployee={setEmployee}
              onNavigateToQuiz={() => setActiveTab('quiz')}
              onNavigateToPathways={() => setActiveTab('pathways')}
              onBackToDashboard={() => setActiveTab('overview')}
              lang={lang}
            />
          </div>
        )}

        {/* VIEW 3: DEDICATED FULL-PAGE AI DOC-TO-QUIZ STUDIO (Feature 2) */}
        {activeTab === 'quiz' && (
          <div key="tab-quiz" className="space-y-6 apple-page-enter">
            <DocQuizEngine
              employee={employee}
              setEmployee={setEmployee}
              onBackToDashboard={() => setActiveTab('overview')}
              lang={lang}
            />
          </div>
        )}

        {/* VIEW 4: DEDICATED FULL-PAGE iGOT & TPAC LEARNING PATHWAYS */}
        {activeTab === 'pathways' && (
          <div key="tab-pathways" className="space-y-6 apple-page-enter">
            <Recommendations
              employee={employee}
              onBackToDashboard={() => setActiveTab('overview')}
              lang={lang}
            />
          </div>
        )}

        {/* VIEW 5: DEDICATED FULL-PAGE STATISTICAL COPILOT ASSISTANT */}
        {activeTab === 'copilot' && (
          <div key="tab-copilot" className="space-y-6 apple-page-enter">
            <StatisticalCopilot
              employee={employee}
              onBackToDashboard={() => setActiveTab('overview')}
              lang={lang}
            />
          </div>
        )}

      </main>

      {/* Employee Profile Edit Modal */}
      {isProfileModalOpen && (
        <EmployeeProfileModal
          employee={employee}
          setEmployee={setEmployee}
          onClose={() => setIsProfileModalOpen(false)}
          lang={lang}
        />
      )}

      {/* Official MoSPI / SIH Footer */}
      <Footer lang={lang} />

    </div>
  );
}
