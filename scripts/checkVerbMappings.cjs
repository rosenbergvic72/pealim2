const fs = require('fs');
const path = require('path');

// Подгружаем JSON-файлы
const verbsData = require('../verbs1.json');
const verbs1RU = require('../verbs11RU.json');

const normalize = (str) =>
  str?.toString().normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const findAllMismatches = (exerciseVerbs, dbEntries) => {
  const mismatchesReport = [];

  for (const exerciseVerb of exerciseVerbs) {
    const correctIndex = exerciseVerb.correctTranslationIndex;

    const expectedTranslations = {
      russian: normalize(exerciseVerb.translationOptions?.[correctIndex]),
      english: normalize(exerciseVerb.translationOptionsEn?.[correctIndex]),
      french: normalize(exerciseVerb.translationOptionsFr?.[correctIndex]),
      spanish: normalize(exerciseVerb.translationOptionsEs?.[correctIndex]),
      portu: normalize(exerciseVerb.translationOptionsPt?.[correctIndex]),
      arabic: normalize(exerciseVerb.translationOptionsAr?.[correctIndex]),
      amharic: normalize(exerciseVerb.translationOptionsAm?.[correctIndex]),
    };

    const genders = ['man', 'woman'];

    for (const gender of genders) {
      const candidates = dbEntries.filter(
        (entry) =>
          normalize(entry.infinitive) === normalize(exerciseVerb.hebrewVerb) &&
          entry.gender === gender
      );

      const matchFound = candidates.some((candidate) => {
        return Object.entries(expectedTranslations).every(([lang, expected]) => {
          if (!expected) return true;
          const actual = normalize(candidate[lang]);
      
          if (actual !== expected) {
            console.log(
              `❌ Нестыковка [${exerciseVerb.hebrewVerb}, gender: ${gender}, lang: ${lang}]:\n  expected: "${expected}"\n  actual:   "${actual}"\n  raw:      "${candidate[lang]}"`
            );
          }
      
          return actual === expected;
        });
      });
      

      if (!matchFound) {
        mismatchesReport.push({
          infinitive: exerciseVerb.hebrewVerb,
          gender,
          expected: expectedTranslations,
          foundCandidates: candidates.map((c) => ({
            russian: c.russian,
            english: c.english,
            french: c.french,
            gender: c.gender,
          })),
        });
      }
    }
  }

  return mismatchesReport;
};

const runCheck = () => {
  const mismatches = findAllMismatches(verbsData, verbs1RU);

  console.log('🔎 Всего несоответствий:', mismatches.length);

  const outputPath = path.join(__dirname, '..', 'mismatches.json');
  fs.writeFileSync(outputPath, JSON.stringify(mismatches, null, 2), 'utf-8');

  console.log(`✅ Результат сохранён в ${outputPath}`);
};

runCheck();
