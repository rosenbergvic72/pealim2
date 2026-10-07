// Reuse conjugation transliterations and audio; never use the infinitive transliteration.
const clean = value => String(value ?? '').normalize('NFC').replace(/[\u0591-\u05c7\u200e\u200f]/g, '').trim().replace(/\s+/g, ' ');
const pronouns = new Set(['אני', 'אתה', 'את', 'הוא', 'היא', 'אנחנו', 'אנו', 'אתם', 'אתן', 'הם', 'הן']);

const genderFamily = gender => ({
  man: 'male',
  men: 'male',
  woman: 'female',
  women: 'female',
}[gender]);

const sentencePronoun = item => {
  const words = clean(item?.hebrew).split(' ').filter(Boolean);
  return words.find(word => pronouns.has(word)) || '';
};

const getCandidates = (index, item, form) => {
  let candidates = index.get(clean(item?.infinitive) + '|' + clean(form)) || [];
  const matches = candidates.filter(x => x.tense ? x.tense === item?.tense : (item?.tense === 'present' ? x.present : !x.present));
  if (matches.length) candidates = matches;
  return candidates;
};

export function buildConjugationIndex(data) {
  const index = new Map();

  for (const row of Array.isArray(data) ? data : []) {
    const infinitive = clean(row.infinitive);
    const hebrew = clean(row.hebrewtext).split(' ');
    const translit = String(row.translit ?? '').trim().split(/\s+/);
    const hasPronoun = hebrew.length === 2 && pronouns.has(hebrew[0]);

    if (!infinitive || !(hebrew.length === 1 || hasPronoun) || !translit[0]) continue;

    // Only strip the subject when both fields contain a subject + a verb.
    if (hasPronoun && translit.length !== 2) continue;

    const form = hebrew[hasPronoun ? 1 : 0];
    const value = hasPronoun ? translit[1] : translit.join(' ');
    const key = infinitive + '|' + form;
    const candidates = index.get(key) || [];

    candidates.push({
      value,
      gender: row.gender,
      present: hasPronoun,
      tense: row.tense,
      subject: hasPronoun ? hebrew[0] : '',
      mp3: String(row.mp3 ?? '').trim().replace(/\.mp3$/i, ''),
    });

    index.set(key, candidates);
  }

  return index;
}

export function optionTransliteration(index, item, form) {
  let candidates = getCandidates(index, item, form);
  const distinct = rows => [...new Set(rows.map(x => x.value))];
  let values = distinct(candidates);

  if (values.length > 1) {
    const targetFamily = genderFamily(item?.gender);
    const genderMatches = candidates.filter(x => targetFamily && genderFamily(x.gender) === targetFamily);
    if (genderMatches.length) values = distinct(genderMatches);
  }

  // Preserve all known readings if the data still does not distinguish them.
  // Never invent a transliteration for a missing form.
  return values.join(' / ');
}

export function optionAudioKey(index, item, form) {
  let candidates = getCandidates(index, item, form).filter(x => x.mp3);
  if (!candidates.length) return '';

  // In the present tense the same written form may belong to several subjects.
  // If the sentence explicitly contains a pronoun, prefer that exact recording.
  const subject = sentencePronoun(item);
  if (subject) {
    const subjectMatches = candidates.filter(x => x.subject === subject);
    if (subjectMatches.length) candidates = subjectMatches;
  }

  // If there is no explicit subject (or several recordings remain), prefer the
  // exact gender stored in the sentence item, then the broader gender family.
  if (candidates.length > 1 && item?.gender) {
    const exactGenderMatches = candidates.filter(x => x.gender === item.gender);
    if (exactGenderMatches.length) candidates = exactGenderMatches;
  }

  if (candidates.length > 1) {
    const targetFamily = genderFamily(item?.gender);
    const familyMatches = candidates.filter(x => targetFamily && genderFamily(x.gender) === targetFamily);
    if (familyMatches.length) candidates = familyMatches;
  }

  // No numbering assumptions: use the mp3 key stored on the matching verbs6RU row.
  // If the sentence has no explicit pronoun, the first suitable recording is used.
  return candidates[0]?.mp3 || '';
}
