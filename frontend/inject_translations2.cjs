const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');

const ADDITIONAL = {
  // Assessment page strings missed in first pass
  "AI Competency Assessment": {
    hi: "एआई दक्षता मूल्यांकन",
    mr: "AI क्षमता मूल्यांकन"
  },
  "Assessment Details": {
    hi: "मूल्यांकन विवरण",
    mr: "मूल्यांकन तपशील"
  },
  "Adaptive Difficulty:": {
    hi: "अनुकूली कठिनाई:",
    mr: "अनुकूली अवघडपणा:"
  },
  "% Complete": {
    hi: "% पूर्ण",
    mr: "% पूर्ण"
  },

  // MCQ Generator strings missed
  "Click to upload or drag & drop PDF": {
    hi: "अपलोड करने के लिए क्लिक करें या PDF खींचें और छोड़ें",
    mr: "अपलोड करण्यासाठी क्लिक करा किंवा PDF ड्रॅग करा"
  },
  "100% Document Grounded": {
    hi: "100% दस्तावेज़ आधारित",
    mr: "100% दस्तऐवज आधारित"
  },
  "Active Quiz Mode": {
    hi: "सक्रिय प्रश्नोत्तरी मोड",
    mr: "सक्रिय प्रश्नोत्तरी मोड"
  },
  "Answered": {
    hi: "उत्तरित",
    mr: "उत्तर दिले"
  },
  "AI MCQ RESULT": {
    hi: "एआई MCQ परिणाम",
    mr: "AI MCQ निकाल"
  },
  "Assessment Completed": {
    hi: "मूल्यांकन पूर्ण",
    mr: "मूल्यांकन पूर्ण"
  },
  "Card View": {
    hi: "कार्ड दृश्य",
    mr: "कार्ड दृश्य"
  },
  "All Questions": {
    hi: "सभी प्रश्न",
    mr: "सर्व प्रश्न"
  },

  // Profile strings missed
  "A network error occurred while saving:": {
    hi: "सहेजते समय एक नेटवर्क त्रुटि हुई:",
    mr: "सेव्ह करताना नेटवर्क त्रुटी झाली:"
  },
  "+ Set Up Profile & Skills Now": {
    hi: "+ अभी प्रोफ़ाइल और कौशल सेट करें",
    mr: "+ आत्ता प्रोफाइल आणि कौशल्ये सेट करा"
  },
  "+ Add Your Skills": {
    hi: "+ अपने कौशल जोड़ें",
    mr: "+ तुमची कौशल्ये जोडा"
  },
  "AI Assessment Performance & History": {
    hi: "एआई मूल्यांकन प्रदर्शन और इतिहास",
    mr: "AI मूल्यांकन कामगिरी आणि इतिहास"
  },
  "+ Start Assessment": {
    hi: "+ मूल्यांकन शुरू करें",
    mr: "+ मूल्यांकन सुरू करा"
  },
  "-- Select Designation --": {
    hi: "-- पदनाम चुनें --",
    mr: "-- पदनाम निवडा --"
  },
  "-- Select Department --": {
    hi: "-- विभाग चुनें --",
    mr: "-- विभाग निवडा --"
  },

  // Research Engine strings missed
  "Apply & Re-rank": {
    hi: "लागू करें और पुनः क्रमांकित करें",
    mr: "लागू करा आणि पुनः क्रमवारी लावा"
  },
  "Collaborative Filtering": {
    hi: "सहयोगी फ़िल्टरिंग",
    mr: "सहयोगी फिल्टरिंग"
  },
  "Current": {
    hi: "वर्तमान",
    mr: "वर्तमान"
  },
};

const files = {
  en: JSON.parse(fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8')),
  hi: JSON.parse(fs.readFileSync(path.join(localesDir, 'hi', 'translation.json'), 'utf8')),
  mr: JSON.parse(fs.readFileSync(path.join(localesDir, 'mr', 'translation.json'), 'utf8')),
};

let added = 0;
for (const [key, vals] of Object.entries(ADDITIONAL)) {
  if (!files.en[key]) { files.en[key] = key; }
  if (!files.hi[key]) { files.hi[key] = vals.hi; added++; }
  if (!files.mr[key]) { files.mr[key] = vals.mr; added++; }
}

fs.writeFileSync(path.join(localesDir, 'en', 'translation.json'), JSON.stringify(files.en, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'hi', 'translation.json'), JSON.stringify(files.hi, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'mr', 'translation.json'), JSON.stringify(files.mr, null, 2), 'utf8');
console.log(`Added ${added} additional translations. Done.`);
