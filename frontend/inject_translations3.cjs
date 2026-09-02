const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');

// These keys exist in the injection scripts but weren't written because
// the key already existed in EN but NOT in HI/MR. 
// We need to force-add them to HI/MR even if EN already has them.

const FORCE_ADD = {
  "Failed to fetch assessment info.": { hi: "मूल्यांकन जानकारी प्राप्त करने में विफल।", mr: "मूल्यांकन माहिती मिळविण्यात अयशस्वी." },
  "Received malformed question from server. Please try again.": { hi: "सर्वर से अमान्य प्रश्न प्राप्त हुआ। कृपया पुनः प्रयास करें।", mr: "सर्व्हरकडून चुकीचा प्रश्न प्राप्त झाला. कृपया पुन्हा प्रयत्न करा." },
  "Loading AI Competency Assessment...": { hi: "एआई दक्षता मूल्यांकन लोड हो रहा है...", mr: "AI क्षमता मूल्यांकन लोड होत आहे..." },
  "This adaptive assessment validates your active competencies against your official designation requirements.": { hi: "यह अनुकूली मूल्यांकन आपकी सक्रिय दक्षताओं को आपकी आधिकारिक पदनाम आवश्यकताओं के विरुद्ध सत्यापित करता है।", mr: "हे अनुकूली मूल्यांकन तुमच्या सक्रिय क्षमतांना तुमच्या अधिकृत पदनाम आवश्यकतांच्या विरोधात प्रमाणित करते." },
  "Yes, adjusts based on your performance.": { hi: "हाँ, आपके प्रदर्शन के आधार पर समायोजित होता है।", mr: "होय, तुमच्या कामगिरीनुसार समायोजित होते." },
  "Initializing Assessment...": { hi: "मूल्यांकन प्रारंभ हो रहा है...", mr: "मूल्यांकन सुरू होत आहे..." },
  "You must select your current skills in your Profile first.": { hi: "आपको पहले अपनी प्रोफ़ाइल में अपने वर्तमान कौशल चुनने होंगे।", mr: "तुम्हाला प्रथम तुमच्या प्रोफाइलमध्ये तुमची सध्याची कौशल्ये निवडायची आहेत." },
  "Generating next adaptive question...": { hi: "अगला अनुकूली प्रश्न तैयार किया जा रहा है...", mr: "पुढचा प्रश्न तयार होत आहे..." },
  "Answer the following question to advance.": { hi: "आगे बढ़ने के लिए निम्नलिखित प्रश्न का उत्तर दें।", mr: "पुढे जाण्यासाठी खालील प्रश्नाचे उत्तर द्या." },
  "Processing...": { hi: "प्रक्रिया हो रही है...", mr: "प्रक्रिया होत आहे..." },
  "Please select a valid PDF file. Other file formats are not supported.": { hi: "कृपया एक वैध PDF फ़ाइल चुनें। अन्य फ़ाइल प्रारूप समर्थित नहीं हैं।", mr: "कृपया एक वैध PDF फाइल निवडा. इतर फाइल स्वरूप समर्थित नाहीत." },
  "The selected file is empty (0 bytes). Please choose a valid PDF document.": { hi: "चयनित फ़ाइल खाली है (0 bytes)। कृपया एक वैध PDF दस्तावेज़ चुनें।", mr: "निवडलेली फाइल रिकामी आहे (0 bytes). कृपया एक वैध PDF दस्तऐवज निवडा." },
  "Please upload a PDF document first before generating MCQs.": { hi: "MCQ बनाने से पहले कृपया पहले एक PDF दस्तावेज़ अपलोड करें।", mr: "MCQ तयार करण्यापूर्वी कृपया प्रथम PDF दस्तऐवज अपलोड करा." },
  "Failed to generate MCQs from the document.": { hi: "दस्तावेज़ से MCQ बनाने में विफल।", mr: "दस्तऐवजातून MCQ तयार करण्यात अयशस्वी." },
  "Failed to generate MCQs. Please verify the PDF format and try again.": { hi: "MCQ बनाने में विफल। कृपया PDF प्रारूप सत्यापित करें और पुनः प्रयास करें।", mr: "MCQ तयार करण्यात अयशस्वी. PDF स्वरूप तपासा आणि पुन्हा प्रयत्न करा." },
  "Upload any statistical report, manual, or policy document in PDF to generate verified questions, test your comprehension in Quiz Mode, and inspect detailed grounding explanations.": { hi: "सत्यापित प्रश्न बनाने, प्रश्नोत्तरी मोड में अपनी समझ का परीक्षण करने के लिए किसी भी सांख्यिकीय रिपोर्ट, मैनुअल, या नीति दस्तावेज़ को PDF में अपलोड करें।", mr: "सत्यापित प्रश्न तयार करण्यासाठी कोणताही सांख्यिकीय अहवाल, मॅन्युअल किंवा धोरण दस्तऐवज PDF मध्ये अपलोड करा." },
  "1. Upload Source PDF": { hi: "1. स्रोत PDF अपलोड करें", mr: "1. स्त्रोत PDF अपलोड करा" },
  "2. Configure Generation": { hi: "2. पीढ़ी कॉन्फ़िगर करें", mr: "2. जनरेशन कॉन्फिगर करा" },
  "Synthesizing Questions with Gemini AI...": { hi: "Gemini AI के साथ प्रश्न संश्लेषित हो रहे हैं...", mr: "Gemini AI सह प्रश्न तयार होत आहेत..." },
  "Generating Grounded Questions...": { hi: "आधारित प्रश्न तैयार किए जा रहे हैं...", mr: "प्रश्न तयार होत आहेत..." },
  "Gemini is processing your PDF document, extracting page text, and crafting verified questions with 4 distinct options and source citations.": { hi: "Gemini आपके PDF दस्तावेज़ को संसाधित कर रहा है और सत्यापित प्रश्न बना रहा है।", mr: "Gemini तुमचे PDF दस्तऐवज प्रक्रिया करत आहे आणि सत्यापित प्रश्न तयार करत आहे." },
  "1. Parsing Document": { hi: "1. दस्तावेज़ पार्सिंग", mr: "1. दस्तऐवज पार्सिंग" },
  "2. Gemini Processing": { hi: "2. Gemini प्रक्रिया", mr: "2. Gemini प्रक्रिया" },
  "3. Quality Validation": { hi: "3. गुणवत्ता सत्यापन", mr: "3. गुणवत्ता सत्यापन" },
  "Questions are synthesized strictly from the uploaded PDF text without external hallucination.": { hi: "प्रश्न केवल अपलोड किए गए PDF पाठ से संश्लेषित किए जाते हैं।", mr: "प्रश्न फक्त अपलोड केलेल्या PDF मजकुरातून तयार केले जातात." },
  "Answer questions at your own pace without spoilers. Answers and explanations are revealed after submission.": { hi: "स्पॉइलर के बिना अपनी गति से प्रश्नों का उत्तर दें। उत्तर और स्पष्टीकरण सबमिशन के बाद प्रकट होते हैं।", mr: "स्पॉयलरशिवाय तुमच्या गतीने प्रश्नांची उत्तरे द्या. उत्तरे सबमिट केल्यानंतर उघड होतात." },
  "Review detailed explanations and verified PDF page numbers for every single question.": { hi: "प्रत्येक प्रश्न के लिए विस्तृत स्पष्टीकरण और सत्यापित PDF पृष्ठ संख्याओं की समीक्षा करें।", mr: "प्रत्येक प्रश्नासाठी सविस्तर स्पष्टीकरण आणि सत्यापित PDF पृष्ठ क्रमांक पुनरावलोकन करा." },
  "Inspect correct answers, explanations, and verified page numbers.": { hi: "सही उत्तर, स्पष्टीकरण और सत्यापित पृष्ठ संख्याओं की जांच करें।", mr: "बरोबर उत्तरे, स्पष्टीकरणे आणि सत्यापित पृष्ठ क्रमांक तपासा." },
  "Full Name is required.": { hi: "पूरा नाम आवश्यक है।", mr: "पूर्ण नाव आवश्यक आहे." },
  "Employee ID is required.": { hi: "कर्मचारी आईडी आवश्यक है।", mr: "कर्मचारी आयडी आवश्यक आहे." },
  "Please select a valid designation.": { hi: "कृपया एक वैध पदनाम चुनें।", mr: "कृपया एक वैध पदनाम निवडा." },
  "The selected designation is no longer available. Please choose again.": { hi: "चयनित पदनाम अब उपलब्ध नहीं है। कृपया पुनः चुनें।", mr: "निवडलेले पदनाम आता उपलब्ध नाही. कृपया पुन्हा निवडा." },
  "Please select a department.": { hi: "कृपया एक विभाग चुनें।", mr: "कृपया एक विभाग निवडा." },
  "Experience years is required.": { hi: "अनुभव वर्ष आवश्यक है।", mr: "अनुभव वर्षे आवश्यक आहे." },
  "Experience years must be a number between 0 and 60.": { hi: "अनुभव वर्ष 0 और 60 के बीच होना चाहिए।", mr: "अनुभव वर्षे 0 ते 60 मधील असणे आवश्यक आहे." },
  "This Employee ID is already registered to another account.": { hi: "यह कर्मचारी आईडी पहले से किसी अन्य खाते से पंजीकृत है।", mr: "हा कर्मचारी आयडी आधीच दुसऱ्या खात्याशी नोंदणीकृत आहे." },
  "Permission error updating profile. Please check your credentials.": { hi: "प्रोफ़ाइल अपडेट करने में अनुमति त्रुटि। कृपया अपनी साख जांचें।", mr: "प्रोफाइल अपडेट करताना परवानगी त्रुटी. तुमच्या क्रेडेन्शियल्स तपासा." },
  "Your profile and skills have been successfully saved.": { hi: "आपकी प्रोफ़ाइल और कौशल सफलतापूर्वक सहेज लिए गए हैं।", mr: "तुमची प्रोफाइल आणि कौशल्ये यशस्वीरित्या सेव्ह झाली." },
  "Please try again.": { hi: "कृपया पुनः प्रयास करें।", mr: "कृपया पुन्हा प्रयत्न करा." },
  "Loading your official profile...": { hi: "आपकी आधिकारिक प्रोफ़ाइल लोड हो रही है...", mr: "तुमची अधिकृत प्रोफाइल लोड होत आहे..." },
  "No employee profile record is currently linked to your account. You can complete your official profile and current skills now.": { hi: "आपके खाते से अभी कोई कर्मचारी प्रोफ़ाइल लिंक नहीं है। आप अभी अपनी प्रोफ़ाइल पूरा कर सकते हैं।", mr: "तुमच्या खात्याशी सध्या कोणताही प्रोफाइल जोडलेला नाही. तुम्ही आत्ता तुमची प्रोफाइल पूर्ण करू शकता." },
  "Loading skills...": { hi: "कौशल लोड हो रहे हैं...", mr: "कौशल्ये लोड होत आहेत..." },
  "No skills recorded yet for your profile.": { hi: "आपकी प्रोफ़ाइल के लिए अभी तक कोई कौशल दर्ज नहीं किया गया।", mr: "तुमच्या प्रोफाइलसाठी अद्याप कोणतेही कौशल्य नोंदवले नाही." },
  "Loading assessment history...": { hi: "मूल्यांकन इतिहास लोड हो रहा है...", mr: "मूल्यांकन इतिहास लोड होत आहे..." },
  "No assessment attempts recorded yet.": { hi: "अभी तक कोई मूल्यांकन प्रयास दर्ज नहीं।", mr: "अद्याप कोणतेही मूल्यांकन प्रयत्न नोंदवले नाहीत." },
  "Enter your official details and mapped competencies.": { hi: "अपने आधिकारिक विवरण और दक्षताएं दर्ज करें।", mr: "तुमचे अधिकृत तपशील आणि क्षमता प्रविष्ट करा." },
  "1. Employee Information": { hi: "1. कर्मचारी जानकारी", mr: "1. कर्मचारी माहिती" },
  "Loading designations...": { hi: "पदनाम लोड हो रहे हैं...", mr: "पदनाम लोड होत आहे..." },
  "2. Manage Current Skills": { hi: "2. वर्तमान कौशल प्रबंधित करें", mr: "2. सध्याची कौशल्ये व्यवस्थापित करा" },
  "Select or deselect skills to update your current competency portfolio.": { hi: "अपने दक्षता पोर्टफोलियो को अपडेट करने के लिए कौशल चुनें या हटाएं।", mr: "तुमचे क्षमता पोर्टफोलिओ अपडेट करण्यासाठी कौशल्ये निवडा किंवा काढा." },
  "Saving Profile...": { hi: "प्रोफ़ाइल सहेजा जा रहा है...", mr: "प्रोफाइल सेव्ह होत आहे..." },
  "Failed to load research dataset.": { hi: "शोध डेटासेट लोड करने में विफल।", mr: "संशोधन डेटासेट लोड करण्यात अयशस्वी." },
  "Loading Research Recommendation Engine...": { hi: "शोध अनुशंसा इंजन लोड हो रहा है...", mr: "संशोधन शिफारस इंजिन लोड होत आहे..." },
  "Initializing 50 Employee profiles and TransE Knowledge Graph models.": { hi: "50 कर्मचारी प्रोफ़ाइल और TransE ज्ञान ग्राफ मॉडल प्रारंभ किए जा रहे हैं।", mr: "50 कर्मचारी प्रोफाइल आणि TransE ज्ञान आलेख मॉडेल प्रारंभ होत आहेत." },
  "Re-ranking...": { hi: "पुनः क्रमांकन हो रहा है...", mr: "पुनः क्रमवारी होत आहे..." },
  "Adjust the importance of each recommendation signal to re-rank courses.": { hi: "पाठ्यक्रमों को पुनः क्रमांकित करने के लिए प्रत्येक अनुशंसा संकेत के महत्व को समायोजित करें।", mr: "अभ्यासक्रमांची पुनः क्रमवारी लावण्यासाठी प्रत्येक शिफारस संकेताचे महत्त्व समायोजित करा." },
  "No learning sequence available.": { hi: "कोई अधिगम अनुक्रम उपलब्ध नहीं है।", mr: "कोणताही शिक्षण अनुक्रम उपलब्ध नाही." },
  "No similar peers found with overlapping profiles.": { hi: "ओवरलैपिंग प्रोफ़ाइल वाले कोई समान साथी नहीं मिले।", mr: "समान प्रोफाइल असलेले कोणतेही समकक्ष आढळले नाहीत." },
};

const files = {
  hi: JSON.parse(fs.readFileSync(path.join(localesDir, 'hi', 'translation.json'), 'utf8')),
  mr: JSON.parse(fs.readFileSync(path.join(localesDir, 'mr', 'translation.json'), 'utf8')),
};

let added = 0;
for (const [key, vals] of Object.entries(FORCE_ADD)) {
  // Force-write even if key exists (may have wrong value)
  files.hi[key] = vals.hi;
  files.mr[key] = vals.mr;
  added++;
}

fs.writeFileSync(path.join(localesDir, 'hi', 'translation.json'), JSON.stringify(files.hi, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'mr', 'translation.json'), JSON.stringify(files.mr, null, 2), 'utf8');
console.log(`Force-wrote ${added} translations. Done.`);
