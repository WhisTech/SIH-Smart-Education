// Official Seed Data for MoSPI - iGOT Karmayogi Competency & Learning Platform
// Problem Statement ID: 26101 (MoSPI - DIID / NSSTA / iGOT Karmayogi)

export const OFFICIAL_ROLES = [
  { id: 'ROLE_001', name: 'Junior Statistical Officer (JSO)', service: 'Subordinate Statistical Service (SSS)', category: 'Statistical', dept: 'MoSPI', experience: '1-3 Years', benchmarkScore: 75 },
  { id: 'ROLE_002', name: 'Senior Statistical Officer (SSO)', service: 'Subordinate Statistical Service (SSS)', category: 'Statistical', dept: 'MoSPI', experience: '4-8 Years', benchmarkScore: 82 },
  { id: 'ROLE_008', name: 'Assistant Director (Statistics)', service: 'Indian Statistical Service (ISS)', category: 'Statistical/Management', dept: 'MoSPI', experience: '5-10 Years', benchmarkScore: 86 },
  { id: 'ROLE_010', name: 'Deputy Director (ISS)', service: 'Indian Statistical Service (ISS)', category: 'Statistical/Management', dept: 'MoSPI', experience: '8-14 Years', benchmarkScore: 89 },
  { id: 'ROLE_013', name: 'Director (Statistics)', service: 'Indian Statistical Service (ISS)', category: 'Senior Management', dept: 'MoSPI', experience: '15+ Years', benchmarkScore: 94 },
  { id: 'ROLE_018', name: 'ISS Probationer', service: 'Indian Statistical Service (ISS)', category: 'Entry/Training', dept: 'NSSTA', experience: 'Induction', benchmarkScore: 68 },
  { id: 'ROLE_006', name: 'Statistical Investigator Gr. 2', service: 'State/UT Statistical System', category: 'Statistical', dept: 'State DES', experience: '2-5 Years', benchmarkScore: 72 },
  { id: 'ROLE_026', name: 'SSS Officer (Field Operations)', service: 'Subordinate Statistical Service (SSS)', category: 'Statistical Operations', dept: 'FOD MoSPI', experience: '3-7 Years', benchmarkScore: 78 },
];

export const COMPETENCY_CATEGORIES = [
  { id: 'DOMAIN', name: 'Official Statistics Mandate', icon: 'BarChart3', color: '#0C447C' },
  { id: 'DATA_AI', name: 'Data Analytics & AI/ML', icon: 'Cpu', color: '#085041' },
  { id: 'METHODS', name: 'Survey Methodology & Sampling', icon: 'Activity', color: '#BA7517' },
  { id: 'IT_GOV', name: 'IT Computing & Data Governance', icon: 'Database', color: '#639922' },
  { id: 'LEADERSHIP', name: 'Leadership & Policy Translation', icon: 'Award', color: '#888780' }
];

export const COMPETENCIES = [
  { id: 'COMP_001', name: 'Official Statistics System Mandate', type: 'Domain', categoryId: 'DOMAIN', desc: 'Understanding Indian Official Statistical System concepts and institutional mandates.', weight: 95 },
  { id: 'COMP_002', name: 'Survey Methodology & Sampling', type: 'Domain', categoryId: 'METHODS', desc: 'Survey design, multi-stage stratified sampling, estimation weights, and variance.', weight: 90 },
  { id: 'COMP_003', name: 'Statistical Methods & Testing', type: 'Functional', categoryId: 'METHODS', desc: 'Hypothesis testing, regression analysis, ANOVA, and probability distributions.', weight: 85 },
  { id: 'COMP_004', name: 'Data Analysis & Interpretation', type: 'Functional', categoryId: 'DATA_AI', desc: 'Analytical synthesis of socio-economic and administrative micro-data.', weight: 90 },
  { id: 'COMP_005', name: 'Data Analytics Techniques', type: 'Functional', categoryId: 'DATA_AI', desc: 'Exploratory data analysis, dimension reduction, and predictive modeling.', weight: 80 },
  { id: 'COMP_006', name: 'Data Visualization & Dashboards', type: 'Functional', categoryId: 'DATA_AI', desc: 'Visual storytelling of tabular indices and statistical reports for policymakers.', weight: 85 },
  { id: 'COMP_008', name: 'Big Data in Official Statistics', type: 'Functional', categoryId: 'DATA_AI', desc: 'Processing high-velocity administrative datasets, web-scraped data, and satellite imagery.', weight: 75 },
  { id: 'COMP_009', name: 'AI & Machine Learning Applications', type: 'Functional', categoryId: 'DATA_AI', desc: 'NLP, automated coding of economic activities (NIC/NCO), and imputation models.', weight: 70 },
  { id: 'COMP_011', name: 'R Programming for Statistics', type: 'Functional', categoryId: 'IT_GOV', desc: 'Statistical programming in R (tidyverse, survey package, markdown reports).', weight: 80 },
  { id: 'COMP_012', name: 'SPSS & Unit-Level Processing', type: 'Functional', categoryId: 'IT_GOV', desc: 'Unit-level data preparation, weight calibration, and cross-tabulation in SPSS.', weight: 75 },
  { id: 'COMP_014', name: 'Time Series & Price Indexing', type: 'Functional', categoryId: 'METHODS', desc: 'Seasonal adjustment (X-13ARIMA), CPI/WPI deflation, and forecasting models.', weight: 85 },
  { id: 'COMP_018', name: 'National Accounts Statistics (SNA)', type: 'Domain', categoryId: 'DOMAIN', desc: 'Gross Domestic Product (GDP), GVA compilation, supply-use tables, and SNA 2008 standards.', weight: 90 },
  { id: 'COMP_019', name: 'Price Statistics & Inflation', type: 'Domain', categoryId: 'DOMAIN', desc: 'Laspeyres/Paasche index formulations, item basket selection, and price collection protocols.', weight: 85 },
  { id: 'COMP_029', name: 'Data Governance & Metadata Standards', type: 'Functional', categoryId: 'IT_GOV', desc: 'NDSAP, Data Protection Act 2023, SDMX metadata frameworks, and quality audits.', weight: 80 },
  { id: 'COMP_033', name: 'Leadership & Team Direction', type: 'Behavioural', categoryId: 'LEADERSHIP', desc: 'Strategic direction, resource allocation, and mentorship in statistical wings.', weight: 75 },
  { id: 'COMP_036', name: 'Official Communication & Briefs', type: 'Behavioural', categoryId: 'LEADERSHIP', desc: 'Drafting policy briefs, parliamentary answers, press releases, and technical notes.', weight: 85 },
  { id: 'COMP_044', name: 'Evidence-Based Policy Support', type: 'Domain', categoryId: 'LEADERSHIP', desc: 'Connecting statistical findings to national SDG indicators and ministry priorities.', weight: 80 }
];

export const INITIAL_EMPLOYEE = {
  empId: 'MoSPI-EMP-4092',
  name: 'Aditya Jadhav',
  roleId: 'ROLE_001',
  roleName: 'Junior Statistical Officer (JSO)',
  service: 'Subordinate Statistical Service (SSS)',
  department: 'Data Informatics & Innovation Division (DIID)',
  ministry: 'Ministry of Statistics & Programme Implementation',
  location: 'Sardar Patel Bhawan, New Delhi',
  experience: '2 Years 8 Months',
  email: 'aditya.jadhav@mospi.gov.in',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  overallCompetencyMatch: 71,
  assessedScores: {
    'COMP_001': 82,
    'COMP_002': 78,
    'COMP_003': 68,
    'COMP_004': 76,
    'COMP_005': 58,
    'COMP_006': 85,
    'COMP_008': 44,
    'COMP_009': 40,
    'COMP_011': 64,
    'COMP_012': 80,
    'COMP_014': 62,
    'COMP_018': 65,
    'COMP_019': 82,
    'COMP_029': 74,
    'COMP_033': 66,
    'COMP_036': 88,
    'COMP_044': 60
  }
};

export const IGOT_COURSES = [
  {
    courseId: 'IGOT_004',
    title: 'Gen AI for Everyone in Governance & Public Statistics',
    provider: 'Fractal Analytics / Karmayogi Bharat',
    duration: '2 hr 49 min',
    competencyTag: 'COMP_009',
    competencyName: 'AI & Machine Learning Applications',
    url: 'https://portal.igotkarmayogi.gov.in/app/toc/do_114085334432260096152',
    level: 'Foundational',
    badge: 'Trending in MoSPI',
    icon: 'Bot',
    rating: 4.9,
    enrolledCount: '14.2k'
  },
  {
    courseId: 'IGOT_011',
    title: 'ChatGPT & Generative AI Tools for Government Officials',
    provider: 'Wadhwani Foundation',
    duration: '1 hr 00 min',
    competencyTag: 'COMP_009',
    competencyName: 'AI & Machine Learning Applications',
    url: 'https://portal.igotkarmayogi.gov.in/app/toc/do_114085865386598400145',
    level: 'Intermediate',
    badge: 'High Impact',
    icon: 'Sparkles',
    rating: 4.8,
    enrolledCount: '28.6k'
  },
  {
    courseId: 'IGOT_005',
    title: 'Data Storytelling & Visualizations for Policy Impact',
    provider: 'Fractal / CBC',
    duration: '2 hr 49 min',
    competencyTag: 'COMP_006',
    competencyName: 'Data Visualization & Dashboards',
    url: 'https://portal.igotkarmayogi.gov.in/app/toc/do_1141311869341614081189',
    level: 'Applied',
    badge: 'Top Recommended',
    icon: 'PieChart',
    rating: 4.9,
    enrolledCount: '9.8k'
  },
  {
    courseId: 'IGOT_002',
    title: 'Digital Personal Data Protection Act 2023: An Overview',
    provider: 'Karmayogi Bharat',
    duration: '1 hr 12 min',
    competencyTag: 'COMP_029',
    competencyName: 'Data Governance & Metadata Standards',
    url: 'https://portal.igotkarmayogi.gov.in/app/toc/do_11401522104510054415',
    level: 'Regulatory',
    badge: 'Mandatory Compliance',
    icon: 'ShieldCheck',
    rating: 4.7,
    enrolledCount: '42.1k'
  },
  {
    courseId: 'IGOT_006',
    title: 'Introduction to Emerging Technologies in Public Systems',
    provider: 'Wadhwani Foundation',
    duration: '2 hr 20 min',
    competencyTag: 'COMP_008',
    competencyName: 'Big Data in Official Statistics',
    url: 'https://portal.igotkarmayogi.gov.in/app/toc/do_1136258909109616641481',
    level: 'Executive',
    badge: 'Advanced Tech',
    icon: 'Layers',
    rating: 4.8,
    enrolledCount: '11.5k'
  },
  {
    courseId: 'IGOT_013',
    title: 'Mission Karmayogi: Competency-Based Civil Service Framework',
    provider: 'Capacity Building Commission',
    duration: '1 hr 00 min',
    competencyTag: 'COMP_001',
    competencyName: 'Official Statistics System Mandate',
    url: 'https://portal.igotkarmayogi.gov.in/app/toc/do_1141637027431383041450',
    level: 'Foundational',
    badge: 'Core Orientation',
    icon: 'BookOpen',
    rating: 4.9,
    enrolledCount: '85.4k'
  }
];

export const NSSTA_TPAC_PROGRAMMES = [
  {
    progId: 'TPAC_014',
    name: 'Foundation Course on Machine Learning Using Python for Official Statistics',
    area: 'Emerging Tech & AI',
    duration: '5 Days (Residential)',
    institute: 'IIT Madras / IISc Bengaluru',
    targetAudience: 'SSS / ISS Officers',
    competencyTag: 'COMP_009',
    calendarYear: '2025-26',
    batchSize: 25,
    status: 'Nomination Open'
  },
  {
    progId: 'TPAC_016',
    name: 'Advanced Big Data, Data Mining & Data Warehousing in MoSPI',
    area: 'Data Science & Big Data',
    duration: '5 Days',
    institute: 'C R Rao AIMSCS Hyderabad / IIIT',
    targetAudience: 'Statistical Officers & Analysts',
    competencyTag: 'COMP_008',
    calendarYear: '2025-26',
    batchSize: 28,
    status: 'Upcoming'
  },
  {
    progId: 'TPAC_001',
    name: 'Advanced Survey Methodology, Multi-Stage Sampling & Estimation',
    area: 'Survey Methodology',
    duration: '5 Days',
    institute: 'Indian Statistical Institute (ISI) Kolkata',
    targetAudience: 'JSO / SSO / ISS Probationers',
    competencyTag: 'COMP_002',
    calendarYear: '2025-26',
    batchSize: 28,
    status: 'Nomination Open'
  },
  {
    progId: 'TPAC_017',
    name: 'Compilation of National Accounts Statistics (SNA 2008) & Social Sector Accounts',
    area: 'Macroeconomic Statistics',
    duration: '5 Days',
    institute: 'NSSTA Greater Noida',
    targetAudience: 'National Accounts Division Officers',
    competencyTag: 'COMP_018',
    calendarYear: '2025-26',
    batchSize: 31,
    status: 'Confirmed'
  }
];

export const SAMPLE_LEARNING_DOCUMENTS = [
  {
    id: 'DOC_01',
    title: 'MoSPI National Accounts Statistics - GDP Estimation Methodology (2024)',
    category: 'National Accounts',
    fileSize: '2.4 MB',
    pages: 18,
    tag: 'COMP_018',
    summary: 'Details the Gross Value Added (GVA) at basic prices, production approach vs expenditure approach, deflator indices, and institutional sector classifications according to SNA 2008 standard.',
    questions: [
      {
        id: 'Q101',
        difficulty: 'Foundation',
        difficultyLevel: 1,
        question: 'In the Indian System of National Accounts (SNA), what is the exact identity connecting GDP at Market Prices and GVA at Basic Prices?',
        options: [
          'GDP at Market Prices = GVA at Basic Prices + Product Taxes - Product Subsidies',
          'GDP at Market Prices = GVA at Basic Prices - Product Taxes + Product Subsidies',
          'GDP at Market Prices = GVA at Factor Cost only',
          'GDP at Market Prices = Net Domestic Product + Depreciation only'
        ],
        correctIndex: 0,
        explanation: 'As per the 2011-12 base revision and SNA 2008 guidelines, GDP at Market Prices is derived by adding Net Product Taxes (Product Taxes minus Product Subsidies) to GVA at Basic Prices.',
        competencyId: 'COMP_018',
        competencyName: 'National Accounts Statistics (SNA)',
        igotRecommendation: 'IGOT_013'
      },
      {
        id: 'Q102',
        difficulty: 'Intermediate',
        difficultyLevel: 2,
        question: 'Which index is primarily used as the deflator for converting nominal services sector GVA to real terms when specific price indices are absent?',
        options: [
          'Consumer Price Index for Industrial Workers (CPI-IW)',
          'Wholesale Price Index (WPI) relevant sub-indices or Sectoral Volume Indicators',
          'Human Development Index Deflator',
          'Foreign Direct Investment Price Index'
        ],
        correctIndex: 1,
        explanation: 'For non-traded or unpriced service sub-sectors, CSO utilizes composite volume indicators alongside relevant WPI/CPI service components for double or single deflation.',
        competencyId: 'COMP_018',
        competencyName: 'National Accounts Statistics (SNA)',
        igotRecommendation: 'IGOT_002'
      },
      {
        id: 'Q103',
        difficulty: 'Advanced',
        difficultyLevel: 3,
        question: 'In the Compilation of Supply and Use Tables (SUT), what identity must be strictly satisfied for every product group across the economy?',
        options: [
          'Total Domestic Output + Imports = Intermediate Consumption + Final Consumption + Capital Formation + Exports',
          'Total Output = Gross Capital Formation only',
          'Gross Value Added = Total Direct Tax Revenues',
          'Net Factor Income from Abroad = Trade Deficit'
        ],
        correctIndex: 0,
        explanation: 'Supply must equal total Use for every commodity. Total Supply (Domestic Output + Imports + Trade/Transport Margins + Net Product Taxes) equals Total Use (Intermediate Use + Final Use + Gross Capital Formation + Exports).',
        competencyId: 'COMP_018',
        competencyName: 'National Accounts Statistics (SNA)',
        igotRecommendation: 'IGOT_017'
      }
    ]
  },
  {
    id: 'DOC_02',
    title: 'MoSPI Guidelines on AI/ML Integration & Big Data in Sample Surveys (2025)',
    category: 'AI & Data Science',
    fileSize: '1.8 MB',
    pages: 14,
    tag: 'COMP_009',
    summary: 'Framework on utilizing natural language processing for automated National Industrial Classification (NIC-2008) coding and computer vision for agricultural crop cutting survey validation.',
    questions: [
      {
        id: 'Q201',
        difficulty: 'Foundation',
        difficultyLevel: 1,
        question: 'How does Machine Learning primarily accelerate the processing of unstructured descriptions in Economic Census data?',
        options: [
          'Automated NLP semantic matching to map textual business activities into 5-digit NIC codes',
          'Replacing the entire need for primary enumerators with pure synthetic data',
          'Automatically publishing raw unverified survey data to social media',
          'Eliminating all sample weights across urban survey blocks'
        ],
        correctIndex: 0,
        explanation: 'NLP models and Transformer-based classification automatically assign 5-digit National Industrial Classification (NIC) and National Classification of Occupations (NCO) codes from free-text field entries with over 94% accuracy.',
        competencyId: 'COMP_009',
        competencyName: 'AI & Machine Learning Applications',
        igotRecommendation: 'IGOT_004'
      },
      {
        id: 'Q202',
        difficulty: 'Intermediate',
        difficultyLevel: 2,
        question: 'When training predictive imputation models for missing socio-economic survey values, which metric best flags model bias across vulnerable demographic subgroups?',
        options: [
          'Disparate Impact Ratio & Subgroup Calibration Error',
          'Overall R-squared on the aggregate training set only',
          'File size of the trained model binary in megabytes',
          'Number of survey questions answered per minute'
        ],
        correctIndex: 0,
        explanation: 'To adhere to Indian Data Governance and Ethics standards (COMP_031), imputation models must be evaluated using demographic fairness metrics like Disparate Impact and Equalized Odds.',
        competencyId: 'COMP_009',
        competencyName: 'AI & Machine Learning Applications',
        igotRecommendation: 'IGOT_011'
      },
      {
        id: 'Q203',
        difficulty: 'Advanced',
        difficultyLevel: 3,
        question: 'In modern High-Frequency Data Analytics, how is Satellite Nightlight Imagery combined with Official GDP estimates?',
        options: [
          'Through spatial-temporal small area estimation (SAE) models to predict district-level economic activity',
          'By overriding all field-level survey data directly',
          'As a substitute for national currency reserve calculations',
          'To replace the decennial population census entirely'
        ],
        correctIndex: 0,
        explanation: 'Nighttime luminosity data acts as an auxiliary covariate in Small Area Estimation (SAE) Bayesian hierarchical models, enhancing granularity for district-level GDP proxy indices.',
        competencyId: 'COMP_008',
        competencyName: 'Big Data in Official Statistics',
        igotRecommendation: 'IGOT_006'
      }
    ]
  },
  {
    id: 'DOC_03',
    title: 'NSSTA Advanced Training Manual: Multi-Stage Stratified Sampling & Survey Design',
    category: 'Survey Methodology',
    fileSize: '3.1 MB',
    pages: 22,
    tag: 'COMP_002',
    summary: 'Covers First Stage Units (FSUs - Villages & Urban Frame Survey Blocks), Ultimate Stage Units (USUs - Households), PPS Circular Systematic Sampling, and Design Effect (Deff) calculations.',
    questions: [
      {
        id: 'Q301',
        difficulty: 'Foundation',
        difficultyLevel: 1,
        question: 'In NSS Periodic Labour Force Surveys (PLFS), what constitutes the First Stage Unit (FSU) in the rural sector?',
        options: [
          'Census Village / Enumeration Block',
          'Individual Household Head',
          'Gram Panchayat Agricultural Land Parcel',
          'District Collectorate Office'
        ],
        correctIndex: 0,
        explanation: 'In the rural sector, the First Stage Units (FSUs) are Census Villages as per the latest decennial Census frames (or 2011 Census list).',
        competencyId: 'COMP_002',
        competencyName: 'Survey Methodology & Sampling',
        igotRecommendation: 'IGOT_013'
      },
      {
        id: 'Q302',
        difficulty: 'Intermediate',
        difficultyLevel: 2,
        question: 'Why is Probability Proportional to Size with Replacement (PPSWR) or Circular Systematic Sampling preferred when selecting FSUs with unequal sizes?',
        options: [
          'It provides larger units a proportionally higher selection probability, reducing sampling variance of total aggregates',
          'It guarantees every village has identical population counts',
          'It eliminates the need for household listing during Second Stage Stratification',
          'It prevents survey supervisors from visiting field locations'
        ],
        correctIndex: 0,
        explanation: 'PPS sampling yields a self-weighting design at the ultimate stage and significantly reduces the variance of estimators for aggregate population totals compared to Simple Random Sampling.',
        competencyId: 'COMP_002',
        competencyName: 'Survey Methodology & Sampling',
        igotRecommendation: 'IGOT_013'
      }
    ]
  }
];
