const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'hi', 'mr'];

function flattenObject(ob) {
    let toReturn = {};
    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            let flatObject = flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

const translations = {};
let hasError = false;

languages.forEach(lang => {
    const filePath = path.join(localesPath, lang, 'translation.json');
    if (!fs.existsSync(filePath)) {
        console.error(`Error: Translation file for '${lang}' not found at ${filePath}`);
        hasError = true;
        translations[lang] = {};
        return;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        translations[lang] = flattenObject(parsed);
    } catch (err) {
        console.error(`Error parsing translation file for '${lang}': ${err.message}`);
        hasError = true;
        translations[lang] = {};
    }
});

if (hasError) process.exit(1);

const enKeys = Object.keys(translations['en']);
console.log(`English base keys count: ${enKeys.length}`);

['hi', 'mr'].forEach(lang => {
    const langKeys = Object.keys(translations[lang]);
    console.log(`\n--- Validating '${lang}' translations ---`);
    
    // Check missing keys
    const missingKeys = enKeys.filter(key => !langKeys.includes(key));
    if (missingKeys.length > 0) {
        console.error(`❌ MISSING KEYS in '${lang}':\n  ${missingKeys.join('\n  ')}`);
        hasError = true;
    } else {
        console.log(`✅ No missing keys in '${lang}'.`);
    }

    // Check extra keys
    const extraKeys = langKeys.filter(key => !enKeys.includes(key));
    if (extraKeys.length > 0) {
        console.error(`❌ EXTRA KEYS in '${lang}':\n  ${extraKeys.join('\n  ')}`);
        hasError = true;
    }

    // Check empty values
    const emptyValues = langKeys.filter(key => !translations[lang][key] || translations[lang][key].trim() === '');
    if (emptyValues.length > 0) {
        console.error(`❌ EMPTY VALUES in '${lang}':\n  ${emptyValues.join('\n  ')}`);
        hasError = true;
    }
});

if (hasError) {
    console.error('\n❌ Translation validation failed.');
    process.exit(1);
} else {
    console.log('\n✅ Translation validation passed successfully!');
}
