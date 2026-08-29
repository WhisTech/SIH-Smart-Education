import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  Volume2, 
  Sparkles, 
  Layers, 
  BookOpen, 
  FileText, 
  HelpCircle,
  X,
  ArrowLeft,
  MessageSquare,
  Cpu,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';

export default function StatisticalCopilot({ employee, onBackToDashboard, lang }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: lang === 'hi' 
        ? `नमस्ते आदित्य जाधव! मैं आपका आधिकारिक सांख्यिकी और कर्मयोगी AI कोपायलट हूँ। आप मुझसे राष्ट्रीय लेखा (GDP/GVA), PLFS नमूना सर्वेक्षण, AI/ML अनुप्रयोगों या पदोन्नति हेतु आवश्यक iGOT पाठ्यक्रमों के बारे में पूछ सकते हैं।`
        : `Hello Aditya Jadhav! I am your Official Statistics & iGOT Karmayogi AI Copilot. Ask me any conceptual question regarding National Accounts (GDP/GVA), PLFS Sampling, AI/ML in surveys, or recommended iGOT competency modules.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const samplePrompts = [
    'Explain GVA at Basic Prices vs GDP at Market Prices in SNA 2008',
    'How does Probability Proportional to Size (PPS) sampling work in PLFS?',
    'Which iGOT courses are recommended for closing my AI/ML competency gap?',
    'What are the key data protection guidelines under DPDP Act 2023 for MoSPI?',
    'How is Machine Learning used for automated NIC-2008 coding in Economic Census?',
    'What training does NSSTA offer for SSS Officers at IIT Madras?'
  ];

  const handleSend = (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('gva') || q.includes('gdp') || q.includes('national accounts')) {
        reply = 'In the Indian System of National Accounts (SNA 2008):\n\n• GVA at Basic Prices = Total Output - Intermediate Consumption + Production Taxes - Production Subsidies.\n• GDP at Market Prices = GVA at Basic Prices + Product Taxes - Product Subsidies.\n\nGVA captures the sectoral contribution to production, whereas GDP captures aggregate expenditure and market valuations.';
      } else if (q.includes('pps') || q.includes('sampling') || q.includes('plfs') || q.includes('nss')) {
        reply = 'In NSS/PLFS Multi-Stage Sampling:\n\n• First Stage Units (FSUs) in rural areas are Census Villages, selected with Probability Proportional to Size with Replacement (PPSWR) or Circular Systematic Sampling.\n• PPS ensures larger enumeration blocks have a proportionally higher chance of selection, minimizing overall variance for aggregate population totals.';
      } else if (q.includes('igot') || q.includes('course') || q.includes('training') || q.includes('recommend')) {
        reply = `Based on your Competency Radar, Aditya, your highest priority gaps are in AI/ML (40%) and Big Data (44%). We recommend:\n\n1. "Gen AI for Everyone in Governance" by Fractal Analytics (IGOT_004) on the iGOT Karmayogi portal.\n2. "ChatGPT & Generative AI Tools" by Wadhwani Foundation (IGOT_011).\n3. NSSTA residential ML course (TPAC_014) at IIT Madras.`;
      } else if (q.includes('dpdp') || q.includes('privacy') || q.includes('governance') || q.includes('data protection')) {
        reply = 'Under the Digital Personal Data Protection (DPDP) Act 2023:\n\n• Statistical agencies like MoSPI act as Data Fiduciaries.\n• Strict purpose limitation and anonymization/k-anonymity protocols must be applied prior to releasing unit-level microdata to prevent deanonymization of survey respondents.';
      } else if (q.includes('nic') || q.includes('machine learning') || q.includes('ai in') || q.includes('coding')) {
        reply = 'In the Economic Census and ASHE surveys, Transformer-based NLP models are trained on free-text descriptions entered by field enumerators to automatically predict 5-digit National Industrial Classification (NIC-2008) and National Classification of Occupations (NCO) codes with >94% confidence, drastically reducing manual coding backlogs.';
      } else if (q.includes('nssta') || q.includes('iit') || q.includes('tpac') || q.includes('calendar')) {
        reply = 'NSSTA (National Statistical Systems Training Academy) has partnered with premier institutes like IIT Madras, IISc Bengaluru, and ISI Kolkata for the FY 2025-26 TPAC calendar. SSS/ISS officers can apply for nomination directly through the iGOT/NSSTA portal.';
      } else if (q.includes('gap') || q.includes('radar') || q.includes('score')) {
        reply = `Your overall profile currently stands at a 71% Competency Match against the SSS benchmark (75%). You have 8 Proficient indicators and 2 Critical Gaps in AI/ML & Big Data. Completing the recommended 2-hour iGOT module will raise your benchmark score to 78%!`;
      } else {
        reply = `Regarding "${query}": In the context of India's Official Statistical System and Capacity Building framework, this involves aligning administrative micro-data with standardized metadata classifications (SDMX), maintaining rigorous survey frames, and utilizing continuous learning on iGOT Karmayogi to maintain high data credibility.`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 500);
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMic = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        handleSend('Explain GVA at Basic Prices vs GDP at Market Prices in SNA 2008');
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 apple-glass-card">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#0C447C] hover:text-white transition-all shadow-sm group"
            title="Return to Master Dashboard"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="apple-badge badge-teal text-xs font-bold uppercase tracking-wider">
                {lang === 'hi' ? 'विशेषता 3' : 'Voice & Text Assistant'}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Bhashini & Web Speech Integrated
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-0.5">
              {lang === 'hi' ? 'सांख्यिकी वॉइस और टेक्स्ट कोपायलट' : 'Official Statistics & iGOT AI Copilot'}
            </h1>
          </div>
        </div>

        {/* Audio Soundwave Indicator */}
        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5">
          {isSpeaking ? (
            <div className="flex items-center gap-1">
              <div className="audio-bar"></div>
              <div className="audio-bar"></div>
              <div className="audio-bar"></div>
              <div className="audio-bar"></div>
              <div className="audio-bar"></div>
              <span className="text-[10px] font-extrabold text-[#BA7517] ml-2">Synthesizing Voice...</span>
            </div>
          ) : isListening ? (
            <span className="apple-badge badge-red text-[10px] font-extrabold animate-pulse">
              Listening to Microphone...
            </span>
          ) : (
            <span className="apple-badge badge-teal text-[10px] font-bold">
              Web Speech Ready (English / हिन्दी)
            </span>
          )}
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <div className="apple-glass-card p-6 flex flex-col h-[650px] justify-between shadow-2xl">
        
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 px-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm transition-all whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-[#0C447C] text-white rounded-br-none font-medium'
                    : 'apple-glass text-[var(--text-primary)] rounded-bl-none border border-black/5 dark:border-white/10 font-normal'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p>{msg.text}</p>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleSpeak(msg.text)}
                      className="text-[var(--text-muted)] hover:text-[#0C447C] dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-black/5 shrink-0 transition-all"
                      title="Read Aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="pt-2 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] font-semibold px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 hover:bg-[#0C447C]/10 text-[var(--text-secondary)] whitespace-nowrap transition-all border border-black/5 shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input & Voice Trigger Bar */}
        <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center gap-2.5">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-bounce shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-[var(--text-primary)] hover:bg-[#0C447C] hover:text-white'
            }`}
            title="Speak Question via Microphone"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={lang === 'hi' ? 'सांख्यिकी, राष्ट्रीय लेखा, या iGOT पाठ्यक्रमों के बारे में पूछें...' : 'Ask about GDP, PLFS sampling, DPDP Act 2023, or iGOT courses in English / Hindi...'}
            className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs text-[var(--text-primary)] outline-none focus:border-[#0C447C] shadow-inner font-medium"
          />

          <button
            onClick={() => handleSend()}
            className="apple-btn-primary py-3 px-5 text-xs font-extrabold shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
