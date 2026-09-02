const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'hi', 'mr'];

const missingKeys = {
  result: {
    overall_score: { en: 'Overall Score', hi: 'कुल स्कोर', mr: 'एकूण गुण' },
    correct: { en: 'correct', hi: 'सही', mr: 'बरोबर' },
    take_another: { en: 'Take Another Assessment', hi: 'एक और मूल्यांकन लें', mr: 'आणखी एक मूल्यांकन घ्या' },
    historical_progression: { en: 'Historical Progression', hi: 'ऐतिहासिक प्रगति', mr: 'ऐतिहासिक प्रगती' },
    improvement: { en: 'Improvement', hi: 'सुधार', mr: 'सुधारणा' },
    decline: { en: 'Decline', hi: 'गिरावट', mr: 'घसरण' },
    previous_attempt: { en: 'Previous Attempt', hi: 'पिछला प्रयास', mr: 'मागील प्रयत्न' },
    current_attempt: { en: 'Current Attempt', hi: 'वर्तमान प्रयास', mr: 'वर्तमान प्रयत्न' },
    previous_score: { en: 'Previous Score', hi: 'पिछला स्कोर', mr: 'मागील गुण' },
    current_score: { en: 'Current Score', hi: 'वर्तमान स्कोर', mr: 'वर्तमान गुण' },
    change: { en: 'Change', hi: 'बदलाव', mr: 'बदल' },
    status: { en: 'Status', hi: 'स्थिति', mr: 'स्थिती' },
    unchanged: { en: 'Unchanged', hi: 'अपरिवर्तित', mr: 'अपरिवर्तित' },
    improved: { en: 'Improved', hi: 'सुधार हुआ', mr: 'सुधारित' },
    declined: { en: 'Declined', hi: 'गिरावट आई', mr: 'घसरण' },
    comparison_desc: { en: 'Comparison between your Assessed Score and Required Standard.', hi: 'आपके मूल्यांकन किए गए स्कोर और आवश्यक मानक के बीच तुलना।', mr: 'तुमचे मूल्यांकन केलेले गुण आणि आवश्यक मानक यांच्यातील तुलना.' },
    no_gaps: { en: 'No skill gaps identified.', hi: 'कोई कौशल अंतर नहीं पाया गया।', mr: 'कोणतेही कौशल्य अंतर आढळले नाही.' },
    strong: { en: 'Strong', hi: 'मजबूत', mr: 'मजबूत' },
    needs_improvement: { en: 'Needs Improvement', hi: 'सुधार की आवश्यकता है', mr: 'सुधारणेची गरज आहे' },
    high_priority: { en: 'High Priority', hi: 'उच्च प्राथमिकता', mr: 'उच्च प्राधान्य' },
    meets_req: { en: 'Meets Requirement', hi: 'आवश्यकता पूरी करता है', mr: 'आवश्यकता पूर्ण करते' },
    current: { en: 'Current', hi: 'वर्तमान', mr: 'वर्तमान' },
    required: { en: 'Required', hi: 'आवश्यक', mr: 'आवश्यक' },
    course_prioritization: { en: 'These courses are prioritized strictly based on your identified skill gaps.', hi: 'इन पाठ्यक्रमों को आपके पहचाने गए कौशल अंतराल के आधार पर सख्ती से प्राथमिकता दी गई है।', mr: 'तुमच्या ओळखलेल्या कौशल्य अंतराच्या आधारे या अभ्यासक्रमांना काटेकोरपणे प्राधान्य दिले गेले आहे.' },
    all_met: { en: 'You meet all required standards. No mandatory courses.', hi: 'आप सभी आवश्यक मानकों को पूरा करते हैं। कोई अनिवार्य पाठ्यक्रम नहीं।', mr: 'तुम्ही सर्व आवश्यक मानकांची पूर्तता करता. कोणतेही अनिवार्य अभ्यासक्रम नाहीत.' },
    provider: { en: 'Provider', hi: 'प्रदाता', mr: 'प्रदाता' },
    duration: { en: 'Duration', hi: 'अवधि', mr: 'कालावधी' },
    recommended_close: { en: 'Recommended to close', hi: 'बंद करने की सिफारिश की गई', mr: 'बंद करण्याची शिफारस केली आहे' },
    explore_courses: { en: 'Explore AI-Recommended Courses for Skill Gaps', hi: 'कौशल अंतराल के लिए एआई-अनुशंसित पाठ्यक्रमों का अन्वेषण करें', mr: 'कौशल्य अंतरासाठी AI-शिफारस केलेले अभ्यासक्रम एक्सप्लोर करा' },
    course_recs: { en: 'AI-Recommended Courses', hi: 'एआई-अनुशंसित पाठ्यक्रम', mr: 'AI-शिफारस केलेले अभ्यासक्रम' }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Merge new keys
    for (const section in missingKeys) {
      if (!data[section]) data[section] = {};
      for (const key in missingKeys[section]) {
        data[section][key] = missingKeys[section][key][lang];
      }
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
