const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');

// ============================================================
// ALL LITERAL (NATURAL LANGUAGE) KEYS — EN / HI / MR
// These are the keys used as t('Some English text') in JSX
// ============================================================
const TRANSLATIONS = {
  // --- System / Loading / Error states ---
  "Loading...": {
    hi: "लोड हो रहा है...",
    mr: "लोड होत आहे..."
  },
  "Processing...": {
    hi: "प्रक्रिया हो रही है...",
    mr: "प्रक्रिया होत आहे..."
  },
  "Saving Profile...": {
    hi: "प्रोफ़ाइल सहेजा जा रहा है...",
    mr: "प्रोफाइल सेव्ह होत आहे..."
  },
  "Re-ranking...": {
    hi: "पुनः क्रमांकन हो रहा है...",
    mr: "पुनः क्रमवारी होत आहे..."
  },
  "Generating Grounded Questions...": {
    hi: "आधारित प्रश्न तैयार किए जा रहे हैं...",
    mr: "प्रश्न तयार होत आहेत..."
  },
  "Generating next adaptive question...": {
    hi: "अगला अनुकूली प्रश्न तैयार किया जा रहा है...",
    mr: "पुढचा प्रश्न तयार होत आहे..."
  },
  "Synthesizing Questions with Gemini AI...": {
    hi: "Gemini AI के साथ प्रश्न संश्लेषित हो रहे हैं...",
    mr: "Gemini AI सह प्रश्न तयार होत आहेत..."
  },
  "Initializing Assessment...": {
    hi: "मूल्यांकन प्रारंभ हो रहा है...",
    mr: "मूल्यांकन सुरू होत आहे..."
  },
  "Loading AI Competency Assessment...": {
    hi: "एआई दक्षता मूल्यांकन लोड हो रहा है...",
    mr: "AI क्षमता मूल्यांकन लोड होत आहे..."
  },
  "Loading Research Recommendation Engine...": {
    hi: "शोध अनुशंसा इंजन लोड हो रहा है...",
    mr: "संशोधन शिफारस इंजिन लोड होत आहे..."
  },
  "Loading assessment history...": {
    hi: "मूल्यांकन इतिहास लोड हो रहा है...",
    mr: "मूल्यांकन इतिहास लोड होत आहे..."
  },
  "Loading designations...": {
    hi: "पदनाम लोड हो रहे हैं...",
    mr: "पदनाम लोड होत आहे..."
  },
  "Loading skills...": {
    hi: "कौशल लोड हो रहे हैं...",
    mr: "कौशल्ये लोड होत आहेत..."
  },
  "Loading your official profile...": {
    hi: "आपकी आधिकारिक प्रोफ़ाइल लोड हो रही है...",
    mr: "तुमची अधिकृत प्रोफाइल लोड होत आहे..."
  },
  "Failed to fetch assessment info.": {
    hi: "मूल्यांकन जानकारी प्राप्त करने में विफल।",
    mr: "मूल्यांकन माहिती मिळविण्यात अयशस्वी."
  },
  "Failed to generate MCQs from the document.": {
    hi: "दस्तावेज़ से MCQ बनाने में विफल।",
    mr: "दस्तऐवजातून MCQ तयार करण्यात अयशस्वी."
  },
  "Failed to generate MCQs. Please verify the PDF format and try again.": {
    hi: "MCQ बनाने में विफल। कृपया PDF प्रारूप सत्यापित करें और पुनः प्रयास करें।",
    mr: "MCQ तयार करण्यात अयशस्वी. PDF स्वरूप तपासा आणि पुन्हा प्रयत्न करा."
  },
  "Failed to load research dataset.": {
    hi: "शोध डेटासेट लोड करने में विफल।",
    mr: "संशोधन डेटासेट लोड करण्यात अयशस्वी."
  },
  "Error fetching question": {
    hi: "प्रश्न प्राप्त करने में त्रुटि",
    mr: "प्रश्न मिळविण्यात त्रुटी"
  },
  "Error starting assessment": {
    hi: "मूल्यांकन प्रारंभ करने में त्रुटि",
    mr: "मूल्यांकन सुरू करण्यात त्रुटी"
  },
  "Error submitting answer": {
    hi: "उत्तर सबमिट करने में त्रुटि",
    mr: "उत्तर सबमिट करण्यात त्रुटी"
  },
  "Error submitting final assessment": {
    hi: "अंतिम मूल्यांकन सबमिट करने में त्रुटि",
    mr: "अंतिम मूल्यांकन सबमिट करण्यात त्रुटी"
  },
  "Received malformed question from server. Please try again.": {
    hi: "सर्वर से अमान्य प्रश्न प्राप्त हुआ। कृपया पुनः प्रयास करें।",
    mr: "सर्व्हरकडून चुकीचा प्रश्न प्राप्त झाला. कृपया पुन्हा प्रयत्न करा."
  },
  "Please try again.": {
    hi: "कृपया पुनः प्रयास करें।",
    mr: "कृपया पुन्हा प्रयत्न करा."
  },
  "Unable to save profile changes:": {
    hi: "प्रोफ़ाइल परिवर्तन सहेजने में असमर्थ:",
    mr: "प्रोफाइल बदल सेव्ह करण्यात अयशस्वी:"
  },
  "Permission error updating profile. Please check your credentials.": {
    hi: "प्रोफ़ाइल अपडेट करने में अनुमति त्रुटि। कृपया अपनी साख जांचें।",
    mr: "प्रोफाइल अपडेट करताना परवानगी त्रुटी. तुमच्या क्रेडेन्शियल्स तपासा."
  },
  "This Employee ID is already registered to another account.": {
    hi: "यह कर्मचारी आईडी पहले से किसी अन्य खाते से पंजीकृत है।",
    mr: "हा कर्मचारी आयडी आधीच दुसऱ्या खात्याशी नोंदणीकृत आहे."
  },
  "Your profile and skills have been successfully saved.": {
    hi: "आपकी प्रोफ़ाइल और कौशल सफलतापूर्वक सहेज लिए गए हैं।",
    mr: "तुमची प्रोफाइल आणि कौशल्ये यशस्वीरित्या सेव्ह झाली."
  },
  "No assessment attempts recorded yet.": {
    hi: "अभी तक कोई मूल्यांकन प्रयास दर्ज नहीं किया गया।",
    mr: "अद्याप कोणतेही मूल्यांकन प्रयत्न नोंदवले नाहीत."
  },
  "No employee profile record is currently linked to your account. You can complete your official profile and current skills now.": {
    hi: "आपके खाते से अभी कोई कर्मचारी प्रोफ़ाइल रिकॉर्ड लिंक नहीं है। आप अभी अपनी आधिकारिक प्रोफ़ाइल और वर्तमान कौशल पूरा कर सकते हैं।",
    mr: "तुमच्या खात्याशी सध्या कोणताही कर्मचारी प्रोफाइल रेकॉर्ड जोडलेला नाही. तुम्ही आत्ता तुमची अधिकृत प्रोफाइल आणि सध्याची कौशल्ये पूर्ण करू शकता."
  },
  "No learning sequence available.": {
    hi: "कोई अधिगम अनुक्रम उपलब्ध नहीं है।",
    mr: "कोणताही शिक्षण अनुक्रम उपलब्ध नाही."
  },
  "No similar peers found with overlapping profiles.": {
    hi: "ओवरलैपिंग प्रोफ़ाइल वाले कोई समान साथी नहीं मिले।",
    mr: "समान प्रोफाइल असलेले कोणतेही समकक्ष आढळले नाहीत."
  },
  "No skills recorded yet for your profile.": {
    hi: "आपकी प्रोफ़ाइल के लिए अभी तक कोई कौशल दर्ज नहीं किया गया।",
    mr: "तुमच्या प्रोफाइलसाठी अद्याप कोणतेही कौशल्य नोंदवले नाही."
  },
  "Please select a department.": {
    hi: "कृपया एक विभाग चुनें।",
    mr: "कृपया एक विभाग निवडा."
  },
  "Please select a valid PDF file. Other file formats are not supported.": {
    hi: "कृपया एक वैध PDF फ़ाइल चुनें। अन्य फ़ाइल प्रारूप समर्थित नहीं हैं।",
    mr: "कृपया एक वैध PDF फाइल निवडा. इतर फाइल स्वरूप समर्थित नाहीत."
  },
  "Please select a valid designation.": {
    hi: "कृपया एक वैध पदनाम चुनें।",
    mr: "कृपया एक वैध पदनाम निवडा."
  },
  "Please upload a PDF document first before generating MCQs.": {
    hi: "MCQ बनाने से पहले कृपया पहले एक PDF दस्तावेज़ अपलोड करें।",
    mr: "MCQ तयार करण्यापूर्वी कृपया प्रथम PDF दस्तऐवज अपलोड करा."
  },
  "The selected designation is no longer available. Please choose again.": {
    hi: "चयनित पदनाम अब उपलब्ध नहीं है। कृपया पुनः चुनें।",
    mr: "निवडलेले पदनाम आता उपलब्ध नाही. कृपया पुन्हा निवडा."
  },
  "The selected file is empty (0 bytes). Please choose a valid PDF document.": {
    hi: "चयनित फ़ाइल खाली है (0 bytes)। कृपया एक वैध PDF दस्तावेज़ चुनें।",
    mr: "निवडलेली फाइल रिकामी आहे (0 bytes). कृपया एक वैध PDF दस्तऐवज निवडा."
  },
  "Full Name is required.": {
    hi: "पूरा नाम आवश्यक है।",
    mr: "पूर्ण नाव आवश्यक आहे."
  },
  "Employee ID is required.": {
    hi: "कर्मचारी आईडी आवश्यक है।",
    mr: "कर्मचारी आयडी आवश्यक आहे."
  },
  "Experience years is required.": {
    hi: "अनुभव वर्ष आवश्यक है।",
    mr: "अनुभव वर्षे आवश्यक आहे."
  },
  "Experience years must be a number between 0 and 60.": {
    hi: "अनुभव वर्ष 0 और 60 के बीच की संख्या होनी चाहिए।",
    mr: "अनुभव वर्षे 0 ते 60 मधील संख्या असणे आवश्यक आहे."
  },
  "Select or deselect skills to update your current competency portfolio.": {
    hi: "अपने वर्तमान दक्षता पोर्टफोलियो को अपडेट करने के लिए कौशल चुनें या हटाएं।",
    mr: "तुमचे सध्याचे क्षमता पोर्टफोलिओ अपडेट करण्यासाठी कौशल्ये निवडा किंवा काढा."
  },
  // --- Profile ---
  "Employee Profile": {
    hi: "कर्मचारी प्रोफ़ाइल",
    mr: "कर्मचारी प्रोफाइल"
  },
  "Official Employee Profile": {
    hi: "आधिकारिक कर्मचारी प्रोफ़ाइल",
    mr: "अधिकृत कर्मचारी प्रोफाइल"
  },
  "Your Profile": {
    hi: "आपकी प्रोफ़ाइल",
    mr: "तुमची प्रोफाइल"
  },
  "Employee Profile Not Set Up": {
    hi: "कर्मचारी प्रोफ़ाइल सेट नहीं किया गया",
    mr: "कर्मचारी प्रोफाइल सेट केलेला नाही"
  },
  "Official Particulars": {
    hi: "आधिकारिक विवरण",
    mr: "अधिकृत तपशील"
  },
  "Manage your service particulars, verified competencies, and AI assessment performance": {
    hi: "अपनी सेवा विवरण, सत्यापित दक्षताएं और एआई मूल्यांकन प्रदर्शन प्रबंधित करें",
    mr: "तुमचे सेवा तपशील, सत्यापित क्षमता आणि AI मूल्यांकन कामगिरी व्यवस्थापित करा"
  },
  "Edit Profile & Skills": {
    hi: "प्रोफ़ाइल और कौशल संपादित करें",
    mr: "प्रोफाइल आणि कौशल्ये संपादित करा"
  },
  "Edit Employee Profile & Skills": {
    hi: "कर्मचारी प्रोफ़ाइल और कौशल संपादित करें",
    mr: "कर्मचारी प्रोफाइल आणि कौशल्ये संपादित करा"
  },
  "Set Up Employee Profile & Skills": {
    hi: "कर्मचारी प्रोफ़ाइल और कौशल सेट करें",
    mr: "कर्मचारी प्रोफाइल आणि कौशल्ये सेट करा"
  },
  "Enter your official details and mapped competencies.": {
    hi: "अपने आधिकारिक विवरण और मैप किए गए दक्षताएं दर्ज करें।",
    mr: "तुमचे अधिकृत तपशील आणि मॅप केलेल्या क्षमता प्रविष्ट करा."
  },
  "1. Employee Information": {
    hi: "1. कर्मचारी जानकारी",
    mr: "1. कर्मचारी माहिती"
  },
  "2. Manage Current Skills": {
    hi: "2. वर्तमान कौशल प्रबंधित करें",
    mr: "2. सध्याची कौशल्ये व्यवस्थापित करा"
  },
  "Full Name": {
    hi: "पूरा नाम",
    mr: "पूर्ण नाव"
  },
  "Full Name *": {
    hi: "पूरा नाम *",
    mr: "पूर्ण नाव *"
  },
  "Employee ID *": {
    hi: "कर्मचारी आईडी *",
    mr: "कर्मचारी आयडी *"
  },
  "Employee / Gov ID": {
    hi: "कर्मचारी / सरकारी आईडी",
    mr: "कर्मचारी / सरकारी आयडी"
  },
  "Designation": {
    hi: "पदनाम",
    mr: "पदनाम"
  },
  "Designation *": {
    hi: "पदनाम *",
    mr: "पदनाम *"
  },
  "Designation:": {
    hi: "पदनाम:",
    mr: "पदनाम:"
  },
  "Department / Division": {
    hi: "विभाग / प्रभाग",
    mr: "विभाग / विभाजन"
  },
  "Department / Division *": {
    hi: "विभाग / प्रभाग *",
    mr: "विभाग / विभाजन *"
  },
  "Official Designation": {
    hi: "आधिकारिक पदनाम",
    mr: "अधिकृत पदनाम"
  },
  "Experience in Statistics": {
    hi: "सांख्यिकी में अनुभव",
    mr: "सांख्यिकीमध्ये अनुभव"
  },
  "Experience in Statistics (Years) *": {
    hi: "सांख्यिकी में अनुभव (वर्ष) *",
    mr: "सांख्यिकीमध्ये अनुभव (वर्षे) *"
  },
  "Years": {
    hi: "वर्ष",
    mr: "वर्षे"
  },
  "y Exp": {
    hi: "वर्ष अनुभव",
    mr: "वर्षे अनुभव"
  },
  "Verified Skills & Competencies": {
    hi: "सत्यापित कौशल और दक्षताएं",
    mr: "सत्यापित कौशल्ये आणि क्षमता"
  },
  "Current Skills:": {
    hi: "वर्तमान कौशल:",
    mr: "सध्याची कौशल्ये:"
  },
  "Strong Skills:": {
    hi: "मजबूत कौशल:",
    mr: "मजबूत कौशल्ये:"
  },
  "Needs Improvement:": {
    hi: "सुधार की आवश्यकता:",
    mr: "सुधारणेची गरज:"
  },
  "Needs Improvement": {
    hi: "सुधार की आवश्यकता है",
    mr: "सुधारणेची गरज आहे"
  },
  "Save Profile & Skills": {
    hi: "प्रोफ़ाइल और कौशल सहेजें",
    mr: "प्रोफाइल आणि कौशल्ये सेव्ह करा"
  },
  "Cancel": {
    hi: "रद्द करें",
    mr: "रद्द करा"
  },
  "View Full Assessment Result": {
    hi: "पूरा मूल्यांकन परिणाम देखें",
    mr: "संपूर्ण मूल्यांकन निकाल पहा"
  },
  "View Result": {
    hi: "परिणाम देखें",
    mr: "निकाल पहा"
  },
  "Assessment History": {
    hi: "मूल्यांकन इतिहास",
    mr: "मूल्यांकन इतिहास"
  },
  "Completion Date": {
    hi: "पूर्णता तिथि",
    mr: "पूर्णता तारीख"
  },
  "Questions Correct": {
    hi: "सही प्रश्न",
    mr: "बरोबर प्रश्न"
  },
  "Overall Score": {
    hi: "कुल स्कोर",
    mr: "एकूण गुण"
  },
  "Overall Competency Score": {
    hi: "समग्र दक्षता स्कोर",
    mr: "एकूण क्षमता गुण"
  },
  "Status": {
    hi: "स्थिति",
    mr: "स्थिती"
  },
  "Status:": {
    hi: "स्थिति:",
    mr: "स्थिती:"
  },
  "Action": {
    hi: "कार्रवाई",
    mr: "क्रिया"
  },
  "Completed": {
    hi: "पूर्ण",
    mr: "पूर्ण"
  },
  // --- Assessment ---
  "Start Assessment": {
    hi: "मूल्यांकन शुरू करें",
    mr: "मूल्यांकन सुरू करा"
  },
  "Take Your First AI Competency Assessment": {
    hi: "अपना पहला एआई दक्षता मूल्यांकन लें",
    mr: "तुमचे पहिले AI क्षमता मूल्यांकन घ्या"
  },
  "Submit Assessment": {
    hi: "मूल्यांकन सबमिट करें",
    mr: "मूल्यांकन सबमिट करा"
  },
  "Next Question": {
    hi: "अगला प्रश्न",
    mr: "पुढील प्रश्न"
  },
  "Next Question →": {
    hi: "अगला प्रश्न →",
    mr: "पुढील प्रश्न →"
  },
  "Next": {
    hi: "अगला",
    mr: "पुढील"
  },
  "Previous": {
    hi: "पिछला",
    mr: "मागील"
  },
  "Question": {
    hi: "प्रश्न",
    mr: "प्रश्न"
  },
  "Questions": {
    hi: "प्रश्न",
    mr: "प्रश्ने"
  },
  "of": {
    hi: "में से",
    mr: "पैकी"
  },
  "Select one option": {
    hi: "एक विकल्प चुनें",
    mr: "एक पर्याय निवडा"
  },
  "Skill": {
    hi: "कौशल",
    mr: "कौशल्य"
  },
  "Skill:": {
    hi: "कौशल:",
    mr: "कौशल्य:"
  },
  "Skill Gap": {
    hi: "कौशल अंतराल",
    mr: "कौशल्य अंतर"
  },
  "Skill Gap Analysis": {
    hi: "कौशल अंतराल विश्लेषण",
    mr: "कौशल्य अंतर विश्लेषण"
  },
  "Skills": {
    hi: "कौशल",
    mr: "कौशल्ये"
  },
  "Skill Domain": {
    hi: "कौशल डोमेन",
    mr: "कौशल्य डोमेन"
  },
  "Answer the following question to advance.": {
    hi: "आगे बढ़ने के लिए निम्नलिखित प्रश्न का उत्तर दें।",
    mr: "पुढे जाण्यासाठी खालील प्रश्नाचे उत्तर द्या."
  },
  "This adaptive assessment validates your active competencies against your official designation requirements.": {
    hi: "यह अनुकूली मूल्यांकन आपकी सक्रिय दक्षताओं को आपकी आधिकारिक पदनाम आवश्यकताओं के विरुद्ध सत्यापित करता है।",
    mr: "हे अनुकूली मूल्यांकन तुमच्या सक्रिय क्षमतांना तुमच्या अधिकृत पदनाम आवश्यकतांच्या विरोधात प्रमाणित करते."
  },
  "Total Questions:": {
    hi: "कुल प्रश्न:",
    mr: "एकूण प्रश्न:"
  },
  "Estimated Time:": {
    hi: "अनुमानित समय:",
    mr: "अंदाजे वेळ:"
  },
  "minutes": {
    hi: "मिनट",
    mr: "मिनिटे"
  },
  "Yes, adjusts based on your performance.": {
    hi: "हाँ, आपके प्रदर्शन के आधार पर समायोजित होता है।",
    mr: "होय, तुमच्या कामगिरीनुसार समायोजित होते."
  },
  "You must select your current skills in your Profile first.": {
    hi: "आपको पहले अपनी प्रोफ़ाइल में अपने वर्तमान कौशल चुनने होंगे।",
    mr: "तुम्हाला प्रथम तुमच्या प्रोफाइलमध्ये तुमची सध्याची कौशल्ये निवडायची आहेत."
  },
  "Difficulty Level": {
    hi: "कठिनाई स्तर",
    mr: "अवघडपणाची पातळी"
  },
  "Difficulty:": {
    hi: "कठिनाई:",
    mr: "अवघडपणा:"
  },
  "Easy": {
    hi: "आसान",
    mr: "सोपे"
  },
  "Medium": {
    hi: "मध्यम",
    mr: "मध्यम"
  },
  "Hard": {
    hi: "कठिन",
    mr: "कठीण"
  },
  "Correct": {
    hi: "सही",
    mr: "बरोबर"
  },
  "Correct Answer": {
    hi: "सही उत्तर",
    mr: "बरोबर उत्तर"
  },
  "Correct Answer:": {
    hi: "सही उत्तर:",
    mr: "बरोबर उत्तर:"
  },
  "Incorrect": {
    hi: "गलत",
    mr: "चुकीचे"
  },
  "Your Answer": {
    hi: "आपका उत्तर",
    mr: "तुमचे उत्तर"
  },
  "Your Answer:": {
    hi: "आपका उत्तर:",
    mr: "तुमचे उत्तर:"
  },
  "Not Answered": {
    hi: "अनुत्तरित",
    mr: "उत्तर दिले नाही"
  },
  "Unanswered": {
    hi: "अनुत्तरित",
    mr: "अनुत्तरित"
  },
  "Final Score": {
    hi: "अंतिम स्कोर",
    mr: "अंतिम गुण"
  },
  "Submit Quiz": {
    hi: "प्रश्नोत्तरी सबमिट करें",
    mr: "प्रश्नोत्तरी सबमिट करा"
  },
  "Submit your answers to calculate score": {
    hi: "स्कोर की गणना करने के लिए अपने उत्तर सबमिट करें",
    mr: "गुण मोजण्यासाठी तुमची उत्तरे सबमिट करा"
  },
  "Retake Quiz": {
    hi: "प्रश्नोत्तरी पुनः लें",
    mr: "प्रश्नोत्तरी पुन्हा घ्या"
  },
  "Detailed Question Review & Explanations": {
    hi: "विस्तृत प्रश्न समीक्षा और स्पष्टीकरण",
    mr: "सविस्तर प्रश्न पुनरावलोकन आणि स्पष्टीकरण"
  },
  "✓ Copied Review": {
    hi: "✓ समीक्षा कॉपी की गई",
    mr: "✓ पुनरावलोकन कॉपी केले"
  },
  "📋 Copy Review JSON": {
    hi: "📋 समीक्षा JSON कॉपी करें",
    mr: "📋 पुनरावलोकन JSON कॉपी करा"
  },
  "✓ Correct": {
    hi: "✓ सही",
    mr: "✓ बरोबर"
  },
  "✗ Incorrect": {
    hi: "✗ गलत",
    mr: "✗ चुकीचे"
  },
  "✓ Met": {
    hi: "✓ पूर्ण",
    mr: "✓ पूर्ण केले"
  },
  "Met": {
    hi: "पूर्ण",
    mr: "पूर्ण"
  },
  "Gap": {
    hi: "अंतराल",
    mr: "अंतर"
  },
  "Gap:": {
    hi: "अंतराल:",
    mr: "अंतर:"
  },
  "Required": {
    hi: "आवश्यक",
    mr: "आवश्यक"
  },
  "Required:": {
    hi: "आवश्यक:",
    mr: "आवश्यक:"
  },
  "Current:": {
    hi: "वर्तमान:",
    mr: "वर्तमान:"
  },
  // --- MCQ Generator ---
  "AI MCQ Generator & Quiz": {
    hi: "एआई MCQ जनरेटर और प्रश्नोत्तरी",
    mr: "AI MCQ जनरेटर आणि प्रश्नोत्तरी"
  },
  "Generate MCQs": {
    hi: "MCQ बनाएं",
    mr: "MCQ तयार करा"
  },
  "MCQs": {
    hi: "MCQ",
    mr: "MCQ"
  },
  "Number of Questions": {
    hi: "प्रश्नों की संख्या",
    mr: "प्रश्नांची संख्या"
  },
  "Gemini AI Powered": {
    hi: "Gemini AI द्वारा संचालित",
    mr: "Gemini AI द्वारे"
  },
  "1. Upload Source PDF": {
    hi: "1. स्रोत PDF अपलोड करें",
    mr: "1. स्त्रोत PDF अपलोड करा"
  },
  "Upload New Document": {
    hi: "नया दस्तावेज़ अपलोड करें",
    mr: "नवीन दस्तऐवज अपलोड करा"
  },
  "Upload Another Document": {
    hi: "दूसरा दस्तावेज़ अपलोड करें",
    mr: "दुसरा दस्तऐवज अपलोड करा"
  },
  "Supports searchable PDF files up to 15MB": {
    hi: "15MB तक की खोज योग्य PDF फ़ाइलों का समर्थन करता है",
    mr: "15MB पर्यंत शोधण्यायोग्य PDF फाइल समर्थित"
  },
  "Ready for analysis": {
    hi: "विश्लेषण के लिए तैयार",
    mr: "विश्लेषणासाठी तयार"
  },
  "Remove": {
    hi: "हटाएं",
    mr: "काढा"
  },
  "Remove file": {
    hi: "फ़ाइल हटाएं",
    mr: "फाइल काढा"
  },
  "2. Configure Generation": {
    hi: "2. पीढ़ी कॉन्फ़िगर करें",
    mr: "2. जनरेशन कॉन्फिगर करा"
  },
  "Interactive Quiz Mode": {
    hi: "इंटरेक्टिव प्रश्नोत्तरी मोड",
    mr: "इंटरेक्टिव प्रश्नोत्तरी मोड"
  },
  "Interactive self-assessment grounded strictly in your official documents": {
    hi: "आपके आधिकारिक दस्तावेजों पर आधारित इंटरेक्टिव स्व-मूल्यांकन",
    mr: "तुमच्या अधिकृत दस्तऐवजांवर आधारित इंटरेक्टिव स्व-मूल्यांकन"
  },
  "Answer questions at your own pace without spoilers. Answers and explanations are revealed after submission.": {
    hi: "स्पॉइलर के बिना अपनी गति से प्रश्नों का उत्तर दें। उत्तर और स्पष्टीकरण सबमिशन के बाद प्रकट होते हैं।",
    mr: "स्पॉयलरशिवाय तुमच्या गतीने प्रश्नांची उत्तरे द्या. उत्तरे आणि स्पष्टीकरणे सबमिट केल्यानंतर उघड होतात."
  },
  "Review detailed explanations and verified PDF page numbers for every single question.": {
    hi: "प्रत्येक प्रश्न के लिए विस्तृत स्पष्टीकरण और सत्यापित PDF पृष्ठ संख्याओं की समीक्षा करें।",
    mr: "प्रत्येक प्रश्नासाठी सविस्तर स्पष्टीकरण आणि सत्यापित PDF पृष्ठ क्रमांक पुनरावलोकन करा."
  },
  "Inspect correct answers, explanations, and verified page numbers.": {
    hi: "सही उत्तर, स्पष्टीकरण और सत्यापित पृष्ठ संख्याओं की जांच करें।",
    mr: "बरोबर उत्तरे, स्पष्टीकरणे आणि सत्यापित पृष्ठ क्रमांक तपासा."
  },
  "Questions are synthesized strictly from the uploaded PDF text without external hallucination.": {
    hi: "प्रश्न बाहरी भ्रम के बिना केवल अपलोड किए गए PDF पाठ से संश्लेषित किए जाते हैं।",
    mr: "प्रश्न बाह्य मतिभ्रमाशिवाय फक्त अपलोड केलेल्या PDF मजकुरातून तयार केले जातात."
  },
  "Upload any statistical report, manual, or policy document in PDF to generate verified questions, test your comprehension in Quiz Mode, and inspect detailed grounding explanations.": {
    hi: "सत्यापित प्रश्न बनाने, प्रश्नोत्तरी मोड में अपनी समझ का परीक्षण करने और विस्तृत आधारित स्पष्टीकरण देखने के लिए किसी भी सांख्यिकीय रिपोर्ट, मैनुअल, या नीति दस्तावेज़ को PDF में अपलोड करें।",
    mr: "सत्यापित प्रश्न तयार करण्यासाठी, प्रश्नोत्तरी मोडमध्ये तुमची आकलन क्षमता तपासण्यासाठी आणि सविस्तर स्पष्टीकरण पाहण्यासाठी कोणताही सांख्यिकीय अहवाल, मॅन्युअल किंवा धोरण दस्तऐवज PDF मध्ये अपलोड करा."
  },
  "Explanation:": {
    hi: "स्पष्टीकरण:",
    mr: "स्पष्टीकरण:"
  },
  "Explanation & Grounding:": {
    hi: "स्पष्टीकरण और आधार:",
    mr: "स्पष्टीकरण आणि आधार:"
  },
  "Source Page Citations": {
    hi: "स्रोत पृष्ठ उद्धरण",
    mr: "स्त्रोत पृष्ठ उद्धरण"
  },
  "Source: Page": {
    hi: "स्रोत: पृष्ठ",
    mr: "स्त्रोत: पृष्ठ"
  },
  "Document:": {
    hi: "दस्तावेज़:",
    mr: "दस्तऐवज:"
  },
  "🌟 Excellent Understanding": {
    hi: "🌟 उत्कृष्ट समझ",
    mr: "🌟 उत्कृष्ट आकलन"
  },
  "👍 Good Effort": {
    hi: "👍 अच्छा प्रयास",
    mr: "👍 चांगले प्रयत्न"
  },
  "📚 Review Recommended": {
    hi: "📚 पुनरावलोकन अनुशंसित",
    mr: "📚 पुनरावलोकन शिफारस केले"
  },
  "ID:": {
    hi: "आईडी:",
    mr: "आयडी:"
  },
  "Course": {
    hi: "पाठ्यक्रम",
    mr: "अभ्यासक्रम"
  },
  "1. Parsing Document": {
    hi: "1. दस्तावेज़ पार्सिंग",
    mr: "1. दस्तऐवज पार्सिंग"
  },
  "2. Gemini Processing": {
    hi: "2. Gemini प्रक्रिया",
    mr: "2. Gemini प्रक्रिया"
  },
  "3. Quality Validation": {
    hi: "3. गुणवत्ता सत्यापन",
    mr: "3. गुणवत्ता सत्यापन"
  },
  "Gemini is processing your PDF document, extracting page text, and crafting verified questions with 4 distinct options and source citations.": {
    hi: "Gemini आपके PDF दस्तावेज़ को संसाधित कर रहा है, पृष्ठ पाठ निकाल रहा है, और 4 अलग-अलग विकल्पों और स्रोत उद्धरणों के साथ सत्यापित प्रश्न बना रहा है।",
    mr: "Gemini तुमचे PDF दस्तऐवज प्रक्रिया करत आहे, पृष्ठ मजकूर काढत आहे आणि 4 वेगळ्या पर्यायांसह आणि स्त्रोत उद्धरणांसह सत्यापित प्रश्न तयार करत आहे."
  },
  "Generation Notice:": {
    hi: "पीढ़ी सूचना:",
    mr: "जनरेशन सूचना:"
  },
  "Notice:": {
    hi: "सूचना:",
    mr: "सूचना:"
  },
  "How AI MCQ Quiz Generator Works": {
    hi: "एआई MCQ प्रश्नोत्तरी जनरेटर कैसे काम करता है",
    mr: "AI MCQ प्रश्नोत्तरी जनरेटर कसे कार्य करते"
  },
  // --- Research Engine ---
  "Personalized Recommendation Engine": {
    hi: "व्यक्तिगत अनुशंसा इंजन",
    mr: "वैयक्तिकृत शिफारस इंजिन"
  },
  "Research Prototype: Multi-signal fusion (Knowledge Graph, Sequence Mining, Collaborative Filtering)": {
    hi: "अनुसंधान प्रोटोटाइप: बहु-संकेत संलयन (ज्ञान ग्राफ, अनुक्रम खनन, सहयोगी फ़िल्टरिंग)",
    mr: "संशोधन प्रोटोटाइप: बहु-संकेत संलयन (ज्ञान ग्राफ, अनुक्रम खनन, सहयोगी फिल्टरिंग)"
  },
  "Knowledge Graph": {
    hi: "ज्ञान ग्राफ",
    mr: "ज्ञान आलेख"
  },
  "Knowledge Graph (Focused)": {
    hi: "ज्ञान ग्राफ (केंद्रित)",
    mr: "ज्ञान आलेख (केंद्रित)"
  },
  "TransE Knowledge Graph": {
    hi: "TransE ज्ञान ग्राफ",
    mr: "TransE ज्ञान आलेख"
  },
  "Learning Sequence": {
    hi: "अधिगम अनुक्रम",
    mr: "शिक्षण अनुक्रम"
  },
  "Learning Sequence Flow": {
    hi: "अधिगम अनुक्रम प्रवाह",
    mr: "शिक्षण अनुक्रम प्रवाह"
  },
  "Sequence Mining": {
    hi: "अनुक्रम खनन",
    mr: "अनुक्रम खनन"
  },
  "Signal Weights": {
    hi: "संकेत भार",
    mr: "संकेत वजन"
  },
  "Signal Breakdown & Weighted Contributions": {
    hi: "संकेत विश्लेषण और भारित योगदान",
    mr: "संकेत विश्लेषण आणि भारांकित योगदान"
  },
  "Signal:": {
    hi: "संकेत:",
    mr: "संकेत:"
  },
  "Adjust the importance of each recommendation signal to re-rank courses.": {
    hi: "पाठ्यक्रमों को पुनः क्रमांकित करने के लिए प्रत्येक अनुशंसा संकेत के महत्व को समायोजित करें।",
    mr: "अभ्यासक्रमांची पुनः क्रमवारी लावण्यासाठी प्रत्येक शिफारस संकेताचे महत्त्व समायोजित करा."
  },
  "Recommendation Fusion": {
    hi: "अनुशंसा संलयन",
    mr: "शिफारस संलयन"
  },
  "Final Recommendations & Fusion Breakdown": {
    hi: "अंतिम अनुशंसाएं और संलयन विश्लेषण",
    mr: "अंतिम शिफारसी आणि संलयन विश्लेषण"
  },
  "Why Recommended?": {
    hi: "अनुशंसित क्यों?",
    mr: "शिफारस का?"
  },
  "Fusion:": {
    hi: "संलयन:",
    mr: "संलयन:"
  },
  "Contrib:": {
    hi: "योगदान:",
    mr: "योगदान:"
  },
  "Peer Similarity Group": {
    hi: "समकक्ष समानता समूह",
    mr: "समकक्ष समानता गट"
  },
  "Similar Employees": {
    hi: "समान कर्मचारी",
    mr: "समान कर्मचारी"
  },
  "Similarity:": {
    hi: "समानता:",
    mr: "समानता:"
  },
  "Target Employee:": {
    hi: "लक्षित कर्मचारी:",
    mr: "लक्ष्य कर्मचारी:"
  },
  "Initializing 50 Employee profiles and TransE Knowledge Graph models.": {
    hi: "50 कर्मचारी प्रोफ़ाइल और TransE ज्ञान ग्राफ मॉडल प्रारंभ किए जा रहे हैं।",
    mr: "50 कर्मचारी प्रोफाइल आणि TransE ज्ञान आलेख मॉडेल प्रारंभ होत आहेत."
  },
  "✓ Courses successfully re-ranked with custom signal weights!": {
    hi: "✓ पाठ्यक्रम कस्टम संकेत भार के साथ सफलतापूर्वक पुनः क्रमांकित किए गए!",
    mr: "✓ कस्टम संकेत वजनासह अभ्यासक्रम यशस्वीरित्या पुनः क्रमवारी लावले!"
  },
  "Step": {
    hi: "चरण",
    mr: "पायरी"
  },
  "Start Here": {
    hi: "यहाँ शुरू करें",
    mr: "येथून सुरू करा"
  },
  "None": {
    hi: "कोई नहीं",
    mr: "काही नाही"
  },
  // --- Generic UI ---
  "Email Address": {
    hi: "ईमेल पता",
    mr: "ईमेल पत्ता"
  },
  "Success:": {
    hi: "सफलता:",
    mr: "यशस्वी:"
  },
  "Verified Login": {
    hi: "सत्यापित लॉगिन",
    mr: "सत्यापित लॉगिन"
  }
};

// Now load and update the JSON files
const languages = ['hi', 'mr'];
const localeFiles = {
  hi: JSON.parse(fs.readFileSync(path.join(localesDir, 'hi', 'translation.json'), 'utf8')),
  mr: JSON.parse(fs.readFileSync(path.join(localesDir, 'mr', 'translation.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8')),
};

// Add literal keys to ALL three language files
// For EN: the value is the key itself (English text)
// For HI/MR: the value is the translation
let addedEn = 0, addedHi = 0, addedMr = 0;
for (const [key, translations] of Object.entries(TRANSLATIONS)) {
  if (localeFiles.en[key] === undefined) {
    localeFiles.en[key] = key; // English fallback: the string itself
    addedEn++;
  }
  if (localeFiles.hi[key] === undefined) {
    localeFiles.hi[key] = translations.hi;
    addedHi++;
  }
  if (localeFiles.mr[key] === undefined) {
    localeFiles.mr[key] = translations.mr;
    addedMr++;
  }
}

// Also add missing profile.* dotted keys
const missingProfileDotted = {
  'common_skills': { en: 'Common Skills', hi: 'सामान्य कौशल', mr: 'सामान्य कौशल्ये' },
  'no_skills_selected': { en: 'No skills selected yet. Click a common skill or search above.', hi: 'अभी तक कोई कौशल नहीं चुना गया। कोई सामान्य कौशल क्लिक करें या ऊपर खोजें।', mr: 'अद्याप कोणतेही कौशल्य निवडले नाही. सामान्य कौशल्यावर क्लिक करा किंवा वर शोधा.' },
  'search_skills': { en: 'Search skills...', hi: 'कौशल खोजें...', mr: 'कौशल्ये शोधा...' },
  'selected_skills': { en: 'Selected Skills', hi: 'चुने गए कौशल', mr: 'निवडलेली कौशल्ये' },
};

for (const [subkey, vals] of Object.entries(missingProfileDotted)) {
  if (!localeFiles.en.profile) localeFiles.en.profile = {};
  if (!localeFiles.hi.profile) localeFiles.hi.profile = {};
  if (!localeFiles.mr.profile) localeFiles.mr.profile = {};
  if (!localeFiles.en.profile[subkey]) { localeFiles.en.profile[subkey] = vals.en; addedEn++; }
  if (!localeFiles.hi.profile[subkey]) { localeFiles.hi.profile[subkey] = vals.hi; addedHi++; }
  if (!localeFiles.mr.profile[subkey]) { localeFiles.mr.profile[subkey] = vals.mr; addedMr++; }
}

// Also add system.* missing keys
const missingSystem = {
  'error': { en: 'An error occurred', hi: 'एक त्रुटि हुई', mr: 'एक त्रुटी झाली' },
  'loading': { en: 'Loading...', hi: 'लोड हो रहा है...', mr: 'लोड होत आहे...' },
  'network_error': { en: 'Network error. Please check your connection.', hi: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।', mr: 'नेटवर्क त्रुटी. कृपया तुमचे कनेक्शन तपासा.' },
  'something_went_wrong': { en: 'Something went wrong. Please try again.', hi: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।', mr: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.' },
};
for (const [subkey, vals] of Object.entries(missingSystem)) {
  if (!localeFiles.hi.system) localeFiles.hi.system = {};
  if (!localeFiles.mr.system) localeFiles.mr.system = {};
  if (!localeFiles.en.system) localeFiles.en.system = {};
  if (!localeFiles.hi.system[subkey]) { localeFiles.hi.system[subkey] = vals.hi; }
  if (!localeFiles.mr.system[subkey]) { localeFiles.mr.system[subkey] = vals.mr; }
  if (!localeFiles.en.system[subkey]) { localeFiles.en.system[subkey] = vals.en; }
}

// Also ensure result.course_recs is in hi and mr
if (!localeFiles.hi.result) localeFiles.hi.result = {};
if (!localeFiles.mr.result) localeFiles.mr.result = {};
if (!localeFiles.hi.result.course_recs) localeFiles.hi.result.course_recs = 'एआई-अनुशंसित पाठ्यक्रम';
if (!localeFiles.mr.result.course_recs) localeFiles.mr.result.course_recs = 'AI-शिफारस केलेले अभ्यासक्रम';

// Write updated files
fs.writeFileSync(path.join(localesDir, 'en', 'translation.json'), JSON.stringify(localeFiles.en, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'hi', 'translation.json'), JSON.stringify(localeFiles.hi, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'mr', 'translation.json'), JSON.stringify(localeFiles.mr, null, 2), 'utf8');

console.log(`Added to EN: ${addedEn} keys`);
console.log(`Added to HI: ${addedHi} keys`);
console.log(`Added to MR: ${addedMr} keys`);
console.log('Done. All translation files updated.');
