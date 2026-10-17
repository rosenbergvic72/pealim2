import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler, Platform } from 'react-native';

import ProgressBar from './ProgressBar';

import { Animated } from 'react-native';

import { Audio } from 'expo-av';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

import TaskDescriptionModal from './TaskDescriptionModal7';

import ExerciseCountStartScreen from './ExerciseCountStartScreen';

import { updateStatistics, getStatistics } from './stat';

import LottieView from 'lottie-react-native';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

const COUNTS = [6, 12, 18, 24];
const DEFAULT_COUNT = 18;

const LANGUAGE_ALIASES = {
  ru: 'ru', russian: 'ru', rus: 'ru', 'ru-ru': 'ru',
  en: 'en', english: 'en', eng: 'en', 'en-us': 'en', 'en-gb': 'en',
  fr: 'fr', french: 'fr', fra: 'fr', 'fr-fr': 'fr',
  es: 'es', spanish: 'es', spa: 'es', 'es-es': 'es',
  pt: 'pt', portuguese: 'pt', por: 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',
  ar: 'ar', arabic: 'ar', arab: 'ar', ara: 'ar', 'ar-il': 'ar',
  am: 'am', amharic: 'am', amh: 'am', 'am-et': 'am',
};

const UI = {
  ru: {
    correct: 'ВЕРНО', wrong: 'НЕВЕРНО', title: 'СПРЯГАЕМ ГЛАГОЛЫ',
    showInfinitive: 'ПОКАЗАТЬ ИНФИНИТИВ', translation: 'ПЕРЕВОД', next: 'СЛЕДУЮЩИЙ',
    menu: 'Menu', stat: 'exercise7', analytics: 'exercise8ru',
  },
  en: {
    correct: 'CORRECT', wrong: 'INCORRECT', title: 'CONJUGATE VERBS',
    showInfinitive: 'SHOW INFINITIVE', translation: 'TRANSLATION', next: 'NEXT',
    menu: 'MenuEn', stat: 'exercise7En', analytics: 'exercise8en',
  },
  fr: {
    correct: 'CORRECT', wrong: 'INCORRECT', title: 'CONJUGUEZ LES VERBES',
    showInfinitive: "AFFICHER L’INFINITIF", translation: 'TRADUCTION', next: 'SUIVANT',
    menu: 'MenuFr', stat: 'exercise7Fr', analytics: 'exercise8fr',
  },
  es: {
    correct: 'CORRECTO', wrong: 'INCORRECTO', title: 'CONJUGA LOS VERBOS',
    showInfinitive: 'MOSTRAR INFINITIVO', translation: 'TRADUCCIÓN', next: 'SIGUIENTE',
    menu: 'MenuEs', stat: 'exercise7Es', analytics: 'exercise8es',
  },
  pt: {
    correct: 'CORRETO', wrong: 'INCORRETO', title: 'CONJUGUE OS VERBOS',
    showInfinitive: 'MOSTRAR INFINITIVO', translation: 'TRADUÇÃO', next: 'SEGUINTE',
    menu: 'MenuPt', stat: 'exercise7Pt', analytics: 'exercise8pt',
  },
  ar: {
    correct: 'صحيح', wrong: 'غير صحيح', title: 'تصريف الأفعال',
    showInfinitive: 'إظهار صيغة المصدر', translation: 'الترجمة', next: 'التالي',
    menu: 'MenuAr', stat: 'exercise7Ar', analytics: 'exercise8ar',
  },
  am: {
    correct: 'ትክክል', wrong: 'ትክክል አይደለም', title: 'ግሶችን ይግለጹ',
    showInfinitive: 'ኢንፊኒቲቭ አሳይ', translation: 'ትርጉም', next: 'ቀጣይ',
    menu: 'MenuAm', stat: 'exercise7Am', analytics: 'exercise8am',
  },
};

const GRADES = {
  ru: [
    'Исключительно! Безупречно! Ты не сделал ни единой ошибки!',
    'Великолепно! Почти идеально, продолжай в том же духе!',
    'Отлично! Ты очень хорошо справляешься!',
    'Хорошо! Ты неплохо усвоил материал!',
    'Достаточно хорошо! Есть стабильный прогресс!',
    'Неплохо! Но есть куда стремиться.',
    'Удовлетворительно! Старайся и всё получится!',
    'Ты начинаешь улавливать главное, продолжай в том же духе!',
    'Попробуй изменить стратегию обучения, это может помочь!',
    'Тяжело, но не сдавайся! Продолжай практиковаться.',
    'Требуется серьезная работа! Важно не унывать и продолжать учиться.',
  ],
  en: [
    'Exceptional! Flawless! You didn’t make a single mistake!',
    'Excellent! Almost perfect, keep up the great work!',
    'Great! You are doing very well!',
    'Good! You’ve learned the material pretty well!',
    'Fairly good! There is steady progress!',
    'Not bad! But there’s room for improvement.',
    'Satisfactory! Keep working and you’ll succeed!',
    'You’re starting to get the hang of it, keep it up!',
    'Try changing your learning strategy, it might help!',
    'It’s tough, but don’t give up! Keep practicing.',
    'Serious work is needed! It’s important not to give up and keep learning.',
  ],
  fr: [
    "Exceptionnel ! Parfait ! Vous n'avez fait aucune erreur !",
    'Excellent ! Presque parfait, continuez comme ça !',
    'Très bien ! Vous vous débrouillez très bien !',
    'Bien ! Vous avez bien appris la matière !',
    'Assez bien ! Il y a un progrès constant !',
    "Pas mal ! Mais il y a encore de la place pour l'amélioration.",
    'Satisfaisant ! Continuez à travailler et vous réussirez !',
    'Vous commencez à comprendre, continuez comme ça !',
    "Essayez de changer votre stratégie d'apprentissage, cela pourrait aider !",
    "C'est difficile, mais ne vous découragez pas ! Continuez à pratiquer.",
    'Un travail sérieux est nécessaire ! Il est important de continuer à apprendre.',
  ],
  es: [
    '¡Excepcional! ¡Perfecto! ¡No cometiste ni un solo error!',
    '¡Excelente! Casi perfecto, ¡sigue así!',
    '¡Genial! ¡Lo estás haciendo muy bien!',
    '¡Bien! Has aprendido el material bastante bien.',
    '¡Bastante bien! Hay un progreso constante.',
    'No está mal, pero hay margen de mejora.',
    '¡Satisfactorio! Sigue trabajando y tendrás éxito.',
    '¡Estás empezando a entenderlo, sigue así!',
    'Intenta cambiar tu estrategia de aprendizaje, ¡podría ayudar!',
    'Es difícil, pero no te rindas. ¡Sigue practicando!',
    'Hace falta más trabajo. Lo importante es seguir aprendiendo.',
  ],
  pt: [
    'Excepcional! Perfeito! Você não cometeu um único erro!',
    'Excelente! Quase perfeito, continue com o ótimo trabalho!',
    'Ótimo! Você está indo muito bem!',
    'Bom! Você aprendeu o material muito bem!',
    'Razoável! Há um progresso constante!',
    'Nada mal! Mas há espaço para melhorar.',
    'Satisfatório! Continue trabalhando e você terá sucesso!',
    'Você está começando a entender, continue assim!',
    'Tente mudar sua estratégia de aprendizado, isso pode ajudar!',
    'Está difícil, mas não desista! Continue praticando.',
    'É necessário mais trabalho. Continue aprendendo.',
  ],
  ar: [
    'ممتاز جدًا! أداء بلا أخطاء!',
    'رائع! قريب جدًا من الكمال، استمر!',
    'ممتاز! أنت تؤدي بشكل رائع!',
    'جيد! لقد أتقنت المادة بشكل جيد!',
    'جيد إلى حد كبير! هناك تقدم ثابت!',
    'ليس سيئًا! لكن ما زال هناك مجال للتحسن.',
    'مُرضٍ! واصل التدريب وستنجح!',
    'بدأت تفهم الفكرة، استمر!',
    'جرّب تغيير أسلوب التعلّم، فقد يساعدك ذلك!',
    'الأمر صعب، لكن لا تستسلم! واصل التدريب.',
    'تحتاج إلى مزيد من العمل. المهم أن تواصل التعلّم.',
  ],
  am: [
    'እጅግ አስደናቂ! ፍጹም ስኬት! ስህተት አላደረጉም!',
    'በጣም ጥሩ! ፍጹም ለመሆን ቀርቧል — ይቀጥሉ!',
    'እጅግ ጥሩ! በጣም ጥሩ እየሰሩ ነው!',
    'ጥሩ! ትምህርቱን በጥሩ ሁኔታ ተምረዋል!',
    'መልካም! የተረጋጋ እድገት አለ!',
    'መጥፎ አይደለም! ግን ለማሻሻል ቦታ አለ።',
    'በመጠኑ ጥሩ! ልምምድዎን ይቀጥሉ!',
    'ዋናውን ሀሳብ መረዳት ጀምረዋል — ይቀጥሉ!',
    'የመማር ዘዴዎን ትንሽ መቀየር ሊረዳ ይችላል!',
    'ከባድ ነው፣ ግን አይተዉ! ልምምድዎን ይቀጥሉ!',
    'ተጨማሪ ልምምድ ያስፈልጋል። መማርዎን ይቀጥሉ።',
  ],
};

const normalizeLanguage = value => {
  const key = String(value || 'ru').trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || 'ru';
};

const getGrade = (language, percentage) => {
  const thresholds = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
  const grades = GRADES[language] || GRADES.ru;
  const index = thresholds.findIndex(value => percentage >= value);
  return grades[index < 0 ? grades.length - 1 : index];
};

const getFormText = (item, language) => {
  if (!item) return '';
  switch (language) {
    case 'en': return item.entext || item.engtext || '';
    case 'fr': return item.frtext || '';
    case 'es': return item.estext || '';
    case 'pt': return item.pttext || '';
    case 'ar': return item.artext || '';
    case 'am': return item.amtext || '';
    default: return item.russiantext || '';
  }
};

const getInfinitiveTranslation = (item, language) => {
  if (!item) return '';
  switch (language) {
    case 'en': return item.english || '';
    case 'fr': return item.french || '';
    case 'es': return item.spanish || '';
    case 'pt': return item.portu || '';
    case 'ar': return item.arabic || '';
    case 'am': return item.amharic || '';
    default: return item.russian || '';
  }
};

const moduleDefault = mod => mod?.default || mod;
const getLanguageComponents = language => {
  switch (language) {
    case 'en': return { Completion: moduleDefault(require('./CompletionMessageEn')), Exit: moduleDefault(require('./ExitConfirmationModalEn')), Stat: moduleDefault(require('./StatModal7En')) };
    case 'fr': return { Completion: moduleDefault(require('./CompletionMessageFr')), Exit: moduleDefault(require('./ExitConfirmationModalFr')), Stat: moduleDefault(require('./StatModal7Fr')) };
    case 'es': return { Completion: moduleDefault(require('./CompletionMessageEs')), Exit: moduleDefault(require('./ExitConfirmationModalEs')), Stat: moduleDefault(require('./StatModal7Es')) };
    case 'pt': return { Completion: moduleDefault(require('./CompletionMessagePt')), Exit: moduleDefault(require('./ExitConfirmationModalPt')), Stat: moduleDefault(require('./StatModal7Pt')) };
    case 'ar': return { Completion: moduleDefault(require('./CompletionMessageAr')), Exit: moduleDefault(require('./ExitConfirmationModalAr')), Stat: moduleDefault(require('./StatModal7Ar')) };
    case 'am': return { Completion: moduleDefault(require('./CompletionMessageAm')), Exit: moduleDefault(require('./ExitConfirmationModalAm')), Stat: moduleDefault(require('./StatModal7Am')) };
    default: return { Completion: moduleDefault(require('./CompletionMessage')), Exit: moduleDefault(require('./ExitConfirmationModal')), Stat: moduleDefault(require('./StatModal7')) };
  }
};

let verbsDataCache = null;
let verbs1DataCache = null;
let soundsConjCache = null;
let soundsCache = null;
const getVerbsData = () => {
  if (!verbsDataCache) {
    const mod = require('./verbs6RU.json');
    verbsDataCache = mod?.default || mod;
  }
  return Array.isArray(verbsDataCache) ? verbsDataCache : [];
};
const getVerbs1Data = () => {
  if (!verbs1DataCache) {
    const mod = require('./verbs1.json');
    verbs1DataCache = mod?.default || mod;
  }
  return Array.isArray(verbs1DataCache) ? verbs1DataCache : [];
};
const getSoundsConj = () => {
  if (!soundsConjCache) soundsConjCache = moduleDefault(require('./soundconj'));
  return soundsConjCache || {};
};
const getSounds = () => {
  if (!soundsCache) soundsCache = moduleDefault(require('./Soundss'));
  return soundsCache || {};
};

const FONT_REG = 'mt-regular';

const FONT_MED = 'mt-medium';

const FONT_BOLD = 'mt-bold';

const FONT_SEMIBOLD = 'mt-semibold';

const HEBREW_FONT = Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold';

const HEBREW_FS = Platform.OS === 'android' ? 34 : 34;

const HEBREW_LINE_H = Platform.OS === 'android' ? 38 : 34;

const HEBREW_LINES = 2;

/* ===================== HEBREW HIGHLIGHTING (Exercise7) ===================== */

// суффиксы настоящего (длинные — раньше)

const PRESENT_SUFFIXES = ['ות', 'ים', 'ה', 'ת'];

const norm = (s) => String(s || '').trim();

const normKey = (s) =>

  String(s || '')

    .trim()

    .toLowerCase()

    .replace(/\s+/g, ' ');

// В verbs6RU у некоторых инфинитивов есть разные значения (например לקרוא).

// Чтобы не мешать разные "смыслы", группируем по infinitive + russian(значение инфинитива).

const getSenseKeyFromV6 = (v) => normKey(v?.russian || v?.english || v?.french || v?.spanish || v?.portu || '');

const makeV6GroupKey = (v) => `${normKey(v?.infinitive)}__${getSenseKeyFromV6(v)}`;

// Build groups only after the user presses START.
let v6GroupsSource = null;
let v6GroupsCache = null;
const getV6Groups = source => {
  if (v6GroupsSource === source && v6GroupsCache) return v6GroupsCache;
  const map = new Map();
  (Array.isArray(source) ? source : []).forEach((v, i) => {
    const key = makeV6GroupKey(v);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ v, i });
  });
  for (const [key, arr] of map) {
    arr.sort((a, b) => a.i - b.i);
    map.set(key, arr.map(x => x.v));
  }
  v6GroupsSource = source;
  v6GroupsCache = map;
  return map;
};

const getIdxInOwnForms = (currentV6, source) => {

  if (!currentV6) return { idx: 0, count: 0 };

  const key = makeV6GroupKey(currentV6);

  const forms = getV6Groups(source).get(key) || [];

  const idxByMp3 = forms.findIndex((x) => String(x?.mp3 || '') === String(currentV6?.mp3 || ''));

  if (idxByMp3 !== -1) return { idx: idxByMp3, count: forms.length };

  const idxByText = forms.findIndex(

    (x) =>

      norm(x?.hebrewtext) === norm(currentV6?.hebrewtext) &&

      norm(x?.gender) === norm(currentV6?.gender) &&

      (!currentV6?.russiantext || norm(x?.russiantext) === norm(currentV6?.russiantext))

  );

  return { idx: idxByText === -1 ? 0 : idxByText, count: forms.length };

};

const getBinyanFromV1 = (currentV6, source) => {

  try {

    const inf = normKey(currentV6?.infinitive);

    const meaningRu = normKey(currentV6?.russian);

    if (!inf) return '';

    const candidates = (Array.isArray(source) ? source : []).filter((x) => normKey(x?.hebrewVerb) === inf);

    for (const c of candidates) {

      const correctIdx = Number(c?.correctTranslationIndex);

      const correctRu = normKey(c?.translationOptions?.[correctIdx]);

      if (correctRu && meaningRu && correctRu === meaningRu) {

        return String(c?.binyan || '');

      }

    }

    // fallback: если по какой-то причине смысл не совпал — берём первый биньян по инфинитиву

    return candidates[0]?.binyan ? String(candidates[0].binyan) : '';

  } catch (e) {

    return '';

  }

};

const isNifalFromBinyan = (binyan) => {

  const b = String(binyan || '').toUpperCase().replace(/[^A-Z]/g, '');

  return b.includes('NIFAL');

};

const yellow = (txt, key) => (

  <Text key={key} style={styles.prefixYellow}>

    {txt}

  </Text>

);

const green = (txt, key) => (

  <Text key={key} style={styles.suffixGreen}>

    {txt}

  </Text>

);

// отделяем пунктуацию в конце, чтобы подсветка не пропадала на "ות,"

const splitTrailingNonHebrew = (str) => {

  const s = String(str || '');

  const m = s.match(/^(.*?)([^א-ת]+)$/);

  if (!m) return { core: s, tail: '' };

  return { core: m[1], tail: m[2] };

};

const renderWithColorRules = (word, { prefix = '', suffix = '' }) => {

  const w0 = String(word || '');

  if (!w0) return '';

  const { core: w, tail } = splitTrailingNonHebrew(w0);

  let middle = w;

  let prefixPart = '';

  let suffixPart = '';

  if (prefix && middle.startsWith(prefix)) {

    prefixPart = prefix;

    middle = middle.slice(prefix.length);

  }

  if (suffix && middle.endsWith(suffix)) {

    suffixPart = suffix;

    middle = middle.slice(0, middle.length - suffix.length);

  }

  return (

    <>

      {prefixPart ? yellow(prefixPart, 'p') : null}

      {middle}

      {suffixPart ? green(suffixPart, 's') : null}

      {tail}

    </>

  );

};

const renderPresentVerbWord = (verbWord) => {

  const verb0 = String(verbWord || '');

  if (!verb0) return '';

  const { core: verb, tail } = splitTrailingNonHebrew(verb0);

  let prefixNode = null;

  let restWord = verb;

  if (restWord.startsWith('מ')) {

    prefixNode = yellow('מ', 'm');

    restWord = restWord.slice(1);

  }

  let matchedSuffix = '';

  for (const suf of PRESENT_SUFFIXES) {

    if (restWord.endsWith(suf)) {

      matchedSuffix = suf;

      break;

    }

  }

  if (!matchedSuffix) {

    return (

      <>

        {prefixNode}

        {restWord}

        {tail}

      </>

    );

  }

  const base = restWord.slice(0, restWord.length - matchedSuffix.length);

  return (

    <>

      {prefixNode}

      {base}

      {green(matchedSuffix, 'suf')}

      {tail}

    </>

  );

};

const renderHebrewText = (hebrewtext, idx, { isNifal = false, mainVerb, showHighlight = true } = {}) => {

  const pos = Number(idx || 0) + 1; // 1..36

  const raw = String(hebrewtext || '');

  if (!showHighlight) return raw;

  const isBeVerb = String(mainVerb?.infinitive || '') === 'להיות';

  const virtualPos = isBeVerb ? pos + 12 : pos;

  // ✅ применять правило нифаля только для 1..24

  const applyNifalNun = isNifal && virtualPos >= 1 && virtualPos <= 24;

  // ✅ "добавка" для нифаля: подсветить первую נ, НЕ ломая остальную подсветку

  const withOptionalNifalNun = (word, renderFn) => {

    const w = String(word || '');

    if (!w) return '';

    const { core, tail } = splitTrailingNonHebrew(w);

    if (applyNifalNun && core.startsWith('נ')) {

      const rest = core.slice(1);

      const renderedRest = renderFn ? renderFn(rest) : rest;

      return (

        <>

          {yellow('נ', 'nifal-nun')}

          {renderedRest}

          {tail}

        </>

      );

    }

    const rendered = renderFn ? renderFn(core) : core;

    return (

      <>

        {rendered}

        {tail}

      </>

    );

  };

  const applyToVerbWord = (text, renderWordFn) => {

    const parts = String(text || '').split(' ').filter(Boolean);

    if (parts.length <= 1) return renderWordFn(parts[0] || '');

    const verb = parts[parts.length - 1];

    const before = parts.slice(0, -1).join(' ');

    return (

      <>

        {before}

        {' '}

        {renderWordFn(verb)}

      </>

    );

  };

  const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {

    const w = String(word || '');

    const { core, tail } = splitTrailingNonHebrew(w);

    const prefix = core.startsWith('ה') ? 'ה' : '';

    return (

      <>

        {renderWithColorRules(core, { prefix, suffix: suffix || '' })}

        {tail}

      </>

    );

  };

  // ====== 1..12 (настоящее): "אני + глагол" ======

  if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {

    const parts = raw.split(' ');

    if (parts.length < 2) {

      return withOptionalNifalNun(parts[0] || '', (x) => renderPresentVerbWord(x));

    }

    const first = parts[0];

    const verb = parts[1];

    const tail = parts.slice(2).join(' ');

    return (

      <>

        {first}

        {' '}

        {withOptionalNifalNun(verb, (x) => renderPresentVerbWord(x))}

        {tail ? ` ${tail}` : ''}

      </>

    );

  }

  // ====== 13..24 (прошедшее): глагол обычно последний ======

  if (virtualPos === 13 || virtualPos === 14)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))

    );

  if (virtualPos === 15 || virtualPos === 16)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))

    );

  if (virtualPos === 17 || virtualPos === 18)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ה'))

    );

  if (virtualPos === 19 || virtualPos === 20)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'נו'))

    );

  if (virtualPos === 21)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תם'))

    );

  if (virtualPos === 22)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תן'))

    );

  if (virtualPos === 23 || virtualPos === 24)

    return applyToVerbWord(raw, (w) =>

      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ו'))

    );

  // ====== 25..36 (будущее) ======

  if (virtualPos === 25) return renderWithColorRules(raw, { prefix: 'א' });

  if (virtualPos === 26) return renderWithColorRules(raw, { prefix: 'א' });

  if (virtualPos === 27) return renderWithColorRules(raw, { prefix: 'ת' });

  if (virtualPos === 28) return renderWithColorRules(raw, { prefix: 'ת', suffix: 'י' });

  if (virtualPos === 29) return renderWithColorRules(raw, { prefix: 'י' });

  if (virtualPos === 30) return renderWithColorRules(raw, { prefix: 'ת' });

  if (virtualPos === 31 || virtualPos === 32) return renderWithColorRules(raw, { prefix: 'נ' });

  if (virtualPos === 33 || virtualPos === 34) return renderWithColorRules(raw, { prefix: 'ת', suffix: 'ו' });

  if (virtualPos === 35 || virtualPos === 36) return renderWithColorRules(raw, { prefix: 'י', suffix: 'ו' });

  return raw;

};

const TypewriterHebrewHighlightedRTL = ({

  text,

  idx = 0,

  isNifal = false,

  mainVerb,

  showHighlight = true,

  runKey,

  typingSpeed = 50,

  style,

  maxFontSizeMultiplier = 1.2,

}) => {

  const [displayedText, setDisplayedText] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {

    const fullText = String(text || '');

    setDisplayedText('');

    if (timerRef.current) clearInterval(timerRef.current);

    if (!fullText) return;

    let i = 0;

    timerRef.current = setInterval(() => {

      i += 1;

      setDisplayedText(fullText.slice(0, i));

      if (i >= fullText.length) {

        clearInterval(timerRef.current);

        timerRef.current = null;

      }

    }, Math.max(10, Number(typingSpeed) || 50));

    return () => {

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = null;

    };

  }, [runKey]);

  return (

    <Text style={style} maxFontSizeMultiplier={maxFontSizeMultiplier}>

      {renderHebrewText(displayedText, idx, { isNifal, mainVerb, showHighlight })}

    </Text>

  );

};

const Exercise8Screen = ({ route }) => {
  const navigation = useNavigation();
  const language = normalizeLanguage(route?.params?.language);
  const copy = UI[language];
  const rtl = language === 'ar';
  const [startVisible, setStartVisible] = useState(true);
  // Согласуем цвет нижней Safe Area с экраном настроек/задания.
  useEffect(() => {
    navigation.setParams({ bottomSafeAreaStage: startVisible ? 'settings' : 'task' });
  }, [navigation, startVisible]);

  // Скрываем ИИ только на стартовом экране; в самом упражнении показываем.
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerHideAI: startVisible });
    }, [navigation, startVisible])
  );

  const [exerciseCount, setExerciseCount] = useState(DEFAULT_COUNT);
  const [verbsData, setVerbsData] = useState([]);
  const [verbs1Data, setVerbs1Data] = useState([]);
  const localizedComponents = useMemo(
    () => (startVisible ? null : getLanguageComponents(language)),
    [startVisible, language]
  );
  const Completion = localizedComponents?.Completion;
  const Exit = localizedComponents?.Exit;
  const Stat = localizedComponents?.Stat;
  const allowLeaveRef = useRef(false);

  const exercise7LoggedRef=useRef(false);

useFocusEffect(

useCallback(()=>{

if(exercise7LoggedRef.current)return;

exercise7LoggedRef.current=true;

FirebaseAnalytics.logFirebaseEvent(copy.analytics,{

screen:copy.analytics

});

return()=>{

exercise7LoggedRef.current=false;

};

},[copy.analytics])

);

  const [verbs, setVerbs] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [displayPairs, setDisplayPairs] = useState([]);

  const [correctAnswers, setCorrectAnswers] = useState(new Set());

  const [correctCount, setCorrectCount] = useState(0);

  const [incorrectCount, setIncorrectCount] = useState(0);

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  // translit toggle: 0=translit+highlight, 1=no translit+highlight, 2=no translit+no highlight

  const [translitMode, setTranslitMode] = useState(0);

  const showTranslit = translitMode === 0;

  const showHighlight = translitMode !== 2;

  const handleTranslitToggle = () => {

    setTranslitMode((m) => (m + 1) % 3);

  };

  const [statistics, setStatistics] = useState(null);

  const [isStatModalVisible, setIsStatModalVisible] = useState(false);

  const [failureSound, setFailureSound] = useState(null);

  const [sound, setSound] = useState(null);

  const [correctSound, setCorrectSound] = useState(null);

  const [fadeAnim] = useState(new Animated.Value(0));

  const [completionMessageVisible, setCompletionMessageVisible] = useState(false);

  const [blockAnimation] = useState(new Animated.Value(-100));

  const [backgroundColorAnim] = useState(new Animated.Value(0));

  const [isCorrectAnswerSelected, setIsCorrectAnswerSelected] = useState(false);

  const [inactiveButtons, setInactiveButtons] = useState(new Set());

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [nextButtonEnabled, setNextButtonEnabled] = useState(false);

  const [completionMessageOpacity] = useState(new Animated.Value(0));

  const [showInfinitive, setShowInfinitive] = useState(false);

  const [showTranslation, setShowTranslation] = useState(false);

  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  const [isAnimationVisible, setIsAnimationVisible] = useState(false);

  const [currentAudioFile, setCurrentAudioFile] = useState(null); // Новый стейт для хранения текущего аудиофайла

  const [progress, setProgress] = useState(0);

  const goToMenu = useCallback(() => {
    allowLeaveRef.current = true;
    navigation.reset({ index: 0, routes: [{ name: copy.menu }] });
  }, [navigation, copy.menu]);

  const showCompletionMessageWithAnimation = () => {

    setCompletionMessageVisible(true);

    Animated.timing(completionMessageOpacity, {

      toValue: 1,

      duration: 500,

      useNativeDriver: true,

    }).start();

  };

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

    const [dontShowAgain7, setDontShowAgain7] = useState(false);

useEffect(() => {
  AsyncStorage.getItem('exercise7_description_hidden')
    .then(hidden => setDontShowAgain7(hidden === 'true'))
    .catch(() => {});
}, []);

  const handleToggleDontShowAgain7 = async () => {

    const newValue = !dontShowAgain7;

    setDontShowAgain7(newValue);

    await AsyncStorage.setItem('exercise7_description_hidden', newValue ? 'true' : '');

    console.log('📌 Клик по чекбоксу. Было:', dontShowAgain7, 'Станет:', !dontShowAgain7);

  };

  const shuffleArray = (array) => {

    let newArray = array.slice();

    for (let i = newArray.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];

    }

    return newArray;

  };

  // useEffect(() => {

  //   if (verbs.length > 0) {

  //     const currentVerb = verbs[currentIndex];

  //     const incorrectAnswers = shuffleArray(

  //       verbs

  //         .filter((verb) => verb.russiantext !== currentVerb.russiantext)

  //         .map((verb) => ({

  //           russiantext: verb.russiantext,

  //           gender: verb.gender,

  //         }))

  //     ).slice(0, 5);

  //     const answers = shuffleArray([{ russiantext: currentVerb.russiantext, gender: currentVerb.gender }, ...incorrectAnswers]);

  //     setDisplayPairs(

  //       answers.map((answer) => ({

  //         ...currentVerb,

  //         russiantext: answer.russiantext,

  //         gender: answer.gender,

  //       }))

  //     );

  //     playAudio(currentVerb.mp3);

  //     setShowInfinitive(false); // Сброс состояния

  //     setCurrentAudioFile(currentVerb.mp3); // Сохранение текущего аудиофайла

  //   }

  // }, [currentIndex, verbs]);

  useEffect(() => {
    if (!verbs.length || !verbsData.length) return;

    const currentVerb = verbs[currentIndex];
    if (!currentVerb) return;

    const getAllowedGenders = gender => {
      if (gender === 'man' || gender === 'men') return ['man', 'men'];
      if (gender === 'woman' || gender === 'women') return ['woman', 'women'];
      return gender ? [gender] : [];
    };

    const allowedGenders = getAllowedGenders(currentVerb.gender);
    const currentText = getFormText(currentVerb, language);
    const makeKey = v => `${getFormText(v, language).trim()}__${String(v?.gender || '').trim()}`;
    const uniqByKey = arr => {
      const seen = new Set();
      return arr.filter(v => {
        const key = makeKey(v);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const basePoolAll = uniqByKey(
      verbsData.filter(v => getFormText(v, language) !== currentText)
    );
    const poolGender = allowedGenders.length
      ? basePoolAll.filter(v => allowedGenders.includes(v.gender))
      : basePoolAll;

    let picked = shuffleArray(poolGender).slice(0, 5);
    if (picked.length < 5) {
      const pickedKeys = new Set(picked.map(makeKey));
      const filler = basePoolAll.filter(v => !pickedKeys.has(makeKey(v)));
      picked = picked.concat(shuffleArray(filler).slice(0, 5 - picked.length));
    }

    const answers = shuffleArray([
      { answerText: currentText, gender: currentVerb.gender },
      ...picked.map(v => ({ answerText: getFormText(v, language), gender: v.gender })),
    ]);

    setDisplayPairs(
      answers.map(answer => ({
        ...currentVerb,
        answerText: answer.answerText,
        gender: answer.gender,
      }))
    );

    playAudio(currentVerb.mp3);
    setShowInfinitive(false);
    setCurrentAudioFile(currentVerb.mp3);
  }, [currentIndex, verbs, verbsData, language]);

  useEffect(() => {

    setShowTranslation(false); // Сброс состояния перевода при смене карточки

  }, [currentIndex]);

  const handleAnswer = (index) => {

    if (exerciseCompleted) return;

    const selectedAnswer = displayPairs[index];

    if (selectedAnswer.answerText === getFormText(verbs[currentIndex], language)) {

      handleCorrectAnswer(index, selectedAnswer.mp3);

    } else {

      handleIncorrectAnswer(index);

    }

  };

  const handleCorrectAnswer = (index, audioFile) => {

    setCorrectCount((prev) => {

      const newCount = prev + 1;

      if (newCount >= exerciseCount) {

        const attempts = newCount + incorrectCount;
        const finalScore = attempts > 0 ? (newCount / attempts) * 100 : 0;
        handleExerciseCompletion(finalScore);

        setExerciseCompleted(true);

        setCompletionMessageVisible(true);

        Animated.timing(completionMessageOpacity, {

          toValue: 1,

          duration: 500,

          useNativeDriver: true,

        }).start();

      }

      setProgress((newCount / exerciseCount) * 100);

      return newCount;

    });

    setCorrectAnswers((prev) => new Set(prev).add(selectedAnswer));

    setIsCorrectAnswerSelected(true);

    setSelectedAnswer(index);

    playCorrectAnswerSound(audioFile);

    changeBackgroundColor(true);

    const pauseDuration = soundEnabled ? 1000 : 200; // Пауза в зависимости от состояния звука

    setTimeout(() => {

      setNextButtonEnabled(true);

    }, pauseDuration);

  };

  const handleIncorrectAnswer = (index) => {

    if (exerciseCompleted) return;

    setIncorrectCount((prev) => prev + 1);

    setSelectedAnswer(index);

    setInactiveButtons((prev) => new Set(prev).add(index));

    playFailureSound();

    changeBackgroundColor(false);

  };

  const changeBackgroundColor = (isCorrect) => {

    backgroundColorAnim.setValue(isCorrect ? 1 : 2);

    Animated.timing(backgroundColorAnim, {

      toValue: isCorrect ? 1 : 2,

      duration: 300,

      useNativeDriver: false,

    }).start(() => {

      setTimeout(() => {

        Animated.timing(backgroundColorAnim, {

          toValue: 0,

          duration: 100,

          useNativeDriver: false,

        }).start();

      }, 100);

    });

  };

  const backgroundColor = backgroundColorAnim.interpolate({

    inputRange: [0, 1, 2],

    outputRange: ['#83A3CD', '#AFFFCA', '#FFBCBC'],

  });

  const fadeIn = () => {

    Animated.timing(fadeAnim, {

      toValue: 1,

      duration: 800,

      useNativeDriver: true,

    }).start();

  };

  useEffect(() => {

    if (verbs[currentIndex]) {

      fadeIn();

    }

  }, [verbs[currentIndex]]);

  useEffect(() => {

    if (!completionMessageVisible && displayPairs.length > 0) {

      blockAnimation.setValue(500);

      Animated.timing(blockAnimation, {

        toValue: 0,

        duration: 300,

        useNativeDriver: true,

      }).start();

    }

  }, [displayPairs, completionMessageVisible]);

  useEffect(() => {
    if (startVisible) return undefined;
    loadFailureSound();
    return () => {
      failureSound?.unloadAsync();
    };
  }, [startVisible]);

  useEffect(() => {

    return () => {

      correctSound?.unloadAsync();

    };

  }, [correctSound]);

  const playCorrectAnswerSound = async (audioKey) => {

    if (!soundEnabled) return;

    try {

      const audioFile = getSoundsConj()[audioKey];

      if (!audioFile) {

        console.error(`Audio file for key ${audioKey} not found.`);

        return;

      }

      if (correctSound) {

        await correctSound.unloadAsync();

      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);

      setCorrectSound(newSound);

      setIsAnimationVisible(true); // Показываем анимацию

      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {

        if (!status.isPlaying) {

          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения

        }

      });

    } catch (error) {

      console.error('Error loading sound:', error);

    }

  };

  const loadFailureSound = async () => {

    try {

      const { sound } = await Audio.Sound.createAsync(require('./assets/sounds/failure.mp3'));

      setFailureSound(sound);

    } catch (error) {

      console.error("Couldn't load failure sound:", error);

    }

  };

  const playAudio = async (audioFileName) => {

    if (!soundEnabled) return; // Добавлена проверка на включение звука

    const audioFile = getSoundsConj()[audioFileName];

    if (!audioFile) {

      console.error(`Audio file ${audioFileName} not found.`);

      return;

    }

    try {

      if (sound && typeof sound.unloadAsync === 'function') {

        await sound.unloadAsync();

      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);

      setSound(newSound);

      setIsAnimationVisible(true); // Показываем анимацию

      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {

        if (!status.isPlaying) {

          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения

        }

      });

    } catch (error) {

      console.error('Error loading sound:', error);

    }

  };

  const playFailureSound = async () => {

    if (!soundEnabled) return;

    try {

      await failureSound.replayAsync();

    } catch (error) {

      console.error('Error playing the failure sound', error);

    }

  };

  const playInfinitiveAudio = async (audioFileName) => {

    try {

      const fileNameKey = audioFileName.replace('.mp3', '');

      const audioFile = getSounds()[fileNameKey];

      if (!audioFile) {

        console.error(`Audio file ${audioFileName} not found.`);

        return;

      }

      if (sound && typeof sound.unloadAsync === 'function') {

        await sound.unloadAsync();

      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);

      setSound(newSound);

      // setIsAnimationVisible(true); // Показываем анимацию

      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {

        if (!status.isPlaying) {

          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения

        }

      });

    } catch (error) {

      console.error('Error loading sound:', error);

    }

  };

  const playAudioAlways = async (audioFileName) => {

    const audioFile = getSoundsConj()[audioFileName];

    if (!audioFile) {

      console.error(`Audio file ${audioFileName} not found.`);

      return;

    }

    try {

      if (sound && typeof sound.unloadAsync === 'function') {

        await sound.unloadAsync();

      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);

      setSound(newSound);

      setIsAnimationVisible(true); // Показываем анимацию

      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {

        if (!status.isPlaying) {

          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения

        }

      });

    } catch (error) {

      console.error('Error loading sound:', error);

    }

  };

  const playCurrentAudio = async () => {

    if (!currentAudioFile) return;

    await playAudioAlways(currentAudioFile);

  };

  const getButtonStyle = (index) => {

    let style = [styles.button];

    if (inactiveButtons.has(index)) {

      style.push(styles.deactivatedButton);

    }

    if (selectedAnswer === index) {

      if (displayPairs[index].answerText === getFormText(verbs[currentIndex], language)) {

        style.push(styles.correctButton);

      } else {

        style.push(styles.wrongButton);

      }

    }

    return style;

  };

  const getImageForGender = (gender) => {

    switch (gender) {

      case 'man':

        return require('./man1.png');

      case 'woman':

        return require('./woman1.png');

      case 'men':

        return require('./men1.png');

      case 'women':

        return require('./women1.png');

      default:

        return null;

    }

  };

  const toggleDescriptionModal = () => {

    setDescriptionModalVisible((prev) => !prev);

  };

  const handleButton3Press = async () => {

    const exerciseId = copy.stat;

    try {

      const stats = await getStatistics(exerciseId);

      setStatistics(stats);

      setIsStatModalVisible(true);

    } catch (error) {

      console.error('Failed to fetch statistics:', error);

      setStatistics(null);

      setIsStatModalVisible(false);

    }

  };

  const handleSoundToggle = () => {

    setSoundEnabled(!soundEnabled);

    if (soundEnabled && sound) {

      sound.setVolumeAsync(0);

    } else if (!soundEnabled && sound) {

      sound.setVolumeAsync(1);

    }

  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (startVisible) {
          goToMenu();
          return true;
        }
        if (exitConfirmationVisible) return false;
        setExitConfirmationVisible(true);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      const unsubscribe = navigation.addListener('beforeRemove', e => {
        if (allowLeaveRef.current) return;
        e.preventDefault();
        if (startVisible) {
          goToMenu();
          return;
        }
        if (!exitConfirmationVisible) setExitConfirmationVisible(true);
      });

      return () => {
        backHandler.remove();
        unsubscribe();
      };
    }, [exitConfirmationVisible, navigation, startVisible, goToMenu])
  );

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  const handleConfirmExit = goToMenu;
  const handleCancelExit = () => setExitConfirmationVisible(false);

  const handleExerciseCompletion = async scoreOverride => {

    const exerciseId = copy.stat;

    const currentScore = Number.isFinite(scoreOverride)
      ? parseFloat(scoreOverride.toFixed(2))
      : parseFloat(progressPercent.toFixed(2));

    console.log(`Exercise completed. Saving stats for ID ${exerciseId} with score ${currentScore}`);

    await updateStatistics(exerciseId, currentScore);

    console.log('Statistics updated successfully');

    setExerciseCompleted(true);

    setTimeout(() => {

      setCompletionMessageVisible(true);

      Animated.timing(completionMessageOpacity, {

        toValue: 1,

        duration: 500, // Длительность анимации 0.5 секунды

        useNativeDriver: true,

      }).start();

    }, 700); // Пауза в 1 секунду

  };

  const prepareDeck = (source, count) => {
    const selected = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;
    setVerbs(shuffleArray(source).slice(0, selected));
    setCurrentIndex(0);
    setDisplayPairs([]);
    setCorrectAnswers(new Set());
    setInactiveButtons(new Set());
    setSelectedAnswer(null);
    setIsCorrectAnswerSelected(false);
    setNextButtonEnabled(false);
    setShowInfinitive(false);
    setShowTranslation(false);
    setCurrentAudioFile(null);
  };

  const resetExercise = () => {
    setCorrectCount(0);
    setIncorrectCount(0);
    setProgress(0);
    setCompletionMessageVisible(false);
    completionMessageOpacity.setValue(0);
    setExerciseCompleted(false);
    prepareDeck(verbsData, exerciseCount);
  };

  const startExercise = count => {
    const source = getVerbsData();
    const v1 = getVerbs1Data();
    const selected = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;
    setExerciseCount(selected);
    setVerbsData(source);
    setVerbs1Data(v1);
    setCorrectCount(0);
    setIncorrectCount(0);
    setProgress(0);
    setCompletionMessageVisible(false);
    completionMessageOpacity.setValue(0);
    setExerciseCompleted(false);
    prepareDeck(source, selected);
    navigation.setOptions({ headerHideAI: false });
    setStartVisible(false);
  };

  const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

  const handleNextPress = () => {

    if (!exerciseCompleted) {

      setCurrentIndex((prevIndex) => (prevIndex + 1) % verbs.length);

      setNextButtonEnabled(false);

      setInactiveButtons(new Set());

      setSelectedAnswer(null);

      setIsCorrectAnswerSelected(false);

      setShowInfinitive(false); // Сброс состояния

      setShowTranslation(false); // Сброс состояния

    }

  };

  const handleContinue = async () => {

    console.log('handleContinue called');

    if (!exerciseCompleted) {

      await handleExerciseCompletion();

    }

    setCompletionMessageVisible(false);

    resetExercise(); // Сброс упражнения

    console.log('Exercise reset');

  };

  if (startVisible) {
    return (
      <ExerciseCountStartScreen
        exerciseNumber={8}
        language={language}
        defaultCount={DEFAULT_COUNT}
        allowedCounts={COUNTS}
        onCountChange={setExerciseCount}
        onStart={startExercise}
        onClose={goToMenu}
      />
    );
  }

  return (

    <ScrollView contentContainerStyle={styles.scrollViewContent}>

      <View style={styles.container}>

      <View style={styles.topBar}>

        <Animated.Image source={require('./VERBIFY.png')} style={[styles.logoImage, { opacity: fadeAnim }]} />

        <View style={styles.buttonContainer}>

          <TouchableOpacity onPress={handleSoundToggle}>

            <Animated.Image

              source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}

              style={[styles.buttonImage, { opacity: fadeAnim }]}

            />

          </TouchableOpacity>

          <TouchableOpacity onPress={handleTranslitToggle}>

            <Animated.Image

              source={

                translitMode === 0

                  ? require('./translit1.png')

                  : translitMode === 1

                  ? require('./translit2.png')

                  : require('./translit3.png')

              }

              style={[styles.buttonImage, { opacity: fadeAnim }]}

            />

          </TouchableOpacity>

          <TouchableOpacity onPress={handleButton3Press}>

            <Animated.Image source={require('./stat.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />

            <Stat visible={isStatModalVisible} onToggle={() => setIsStatModalVisible(false)} statistics={statistics} />

          </TouchableOpacity>

          <TouchableOpacity onPress={toggleDescriptionModal}>

            <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />

            <TaskDescriptionModal

              visible={isDescriptionModalVisible}

  onToggle={toggleDescriptionModal}

  language={language}

  dontShowAgain7={dontShowAgain7}

  onToggleDontShowAgain={handleToggleDontShowAgain7}

            />

          </TouchableOpacity>

        </View>

      </View>

      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>

        <View style={styles.textContainer}>

          <Text style={[styles.prtext, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.correct}: {correctCount}</Text>

          <Text style={[styles.prtext, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.wrong}: {incorrectCount}</Text>

        </View>

        <View style={styles.remainingTasksContainer}>

          <Text style={styles.remainingTasksText}maxFontSizeMultiplier={1.2}>{verbs.length - currentIndex}</Text>

        </View>

        <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>

          <Text style={styles.percentText}maxFontSizeMultiplier={1.2}>{progressPercent.toFixed(2)}%</Text>

        </Animated.View>

      </Animated.View>

      <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>

        <ProgressBar progress={progress} totalExercises={100} />

      </Animated.View>

      <Animated.Text style={[styles.title, rtl && styles.rtlText, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>{copy.title}</Animated.Text>

      <View style={styles.verbContainerWrapper}>

  {!showInfinitive ? (

    <TouchableOpacity style={[styles.verbContainer, styles.activeButton]} onPress={() => setShowInfinitive(true)}>

      <Text style={[styles.verbTextActive, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.showInfinitive}</Text>

    </TouchableOpacity>

  ) : (

    <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>

      {verbs[currentIndex] && (

        <>

          <Text style={styles.verbText}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].infinitive}</Text>

          <Text style={styles.verbTextTr}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].transliteration}</Text>

          {!showTranslation ? (

            <TouchableOpacity style={styles.translationButton} onPress={() => setShowTranslation(true)}>

              <Text style={[styles.verbTextActive, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.translation}</Text>

            </TouchableOpacity>

          ) : (

            <Text style={[styles.verbTextRu, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{getInfinitiveTranslation(verbs[currentIndex], language)}</Text>

          )}

          <TouchableOpacity onPress={() => playInfinitiveAudio(verbs[currentIndex].audioFile)} style={styles.audioButton1}>

            <Image source={require('./speaker3.png')} style={styles.audioIcon1} />

          </TouchableOpacity>

        </>

      )}

    </Animated.View>

  )}

</View>

      <View style={styles.hebrewCardContainer}>

        {verbs[currentIndex] && (

          <View style={styles.hebrewCard}>

            {isAnimationVisible && (

  <LottieView

    source={require('./assets/Animation - 1718430107767.json')}

    autoPlay

    loop={false}

    style={styles.lottie}

    onAnimationFinish={() => setIsAnimationVisible(false)} // Скрывать анимацию после завершения

  />

)}

            {(() => {

              const cv = verbs[currentIndex];

              const { idx } = getIdxInOwnForms(cv, verbsData);

              const binyan = getBinyanFromV1(cv, verbs1Data);

              const nifal = isNifalFromBinyan(binyan);

              const runKey = `${cv?.mp3 || ''}_${currentIndex}`;

              const TRANSLIT_ROW_H = 30;

              return (

                <View

                  style={{

                    width: '100%',

                    minHeight: 90,

                    position: 'relative',

                    justifyContent: 'center',

                    alignItems: 'center',

                    paddingHorizontal: 12,

                    // резерв под строку транслита, чтобы высота НЕ прыгала

                    paddingBottom: TRANSLIT_ROW_H,

                  }}

                >

                  {/* Hebrew (центруем, а при скрытом translit немного опускаем вниз) */}

                  <View

                    style={{

                      justifyContent: 'center',

                      alignItems: 'center',

                      transform: [{ translateY: showTranslit ? 0 : TRANSLIT_ROW_H / 2 }],

                    }}

                  >

                 <View style={styles.hebrewTextBox}>

                                                 <TypewriterHebrewHighlightedRTL

                   text={cv.hebrewtext}

                   idx={idx}

                   isNifal={nifal}

                   mainVerb={cv}

                   showHighlight={showHighlight}

                   runKey={runKey}

                   typingSpeed={50}

                   style={[

    styles.hebrewText,

    !showTranslit && {

      transform: [{ translateY: Platform.OS === 'ios' ? 4 : 0 }],

    },

  ]}

                 />

                                                </View>

                  </View>

                  {/* Transliteration row: скрываем opacity, но место всегда есть */}

                  <View

                    style={{

                      position: 'absolute',

                      left: 0,

                      right: 0,

                      bottom: 6,

                      height: TRANSLIT_ROW_H,

                      justifyContent: 'center',

                      alignItems: 'center',

                      opacity: showTranslit ? 1 : 0,

                    }}

                  >

                    <Text style={styles.translitText} maxFontSizeMultiplier={1.2}>

                      {cv.translit}

                    </Text>

                  </View>

                </View>

              );})()}

            <TouchableOpacity onPress={playCurrentAudio} style={styles.audioButton}>

              <Image source={require('./speaker3.png')} style={styles.audioIcon} />

            </TouchableOpacity>

          </View>

        )}

      </View>

      <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>

        <View style={styles.answerContainer}>

          {displayPairs.map((pair, index) => (

            <TouchableOpacity

              key={index}

              style={getButtonStyle(index)}

              onPress={() => handleAnswer(index)}

              disabled={inactiveButtons.has(index) || isCorrectAnswerSelected}

            >

              <Text

                style={[

                  styles.text,

                  styles.russianText,

                  rtl && styles.rtlText,

                  inactiveButtons.has(index) ? styles.deactivatedButtonText : {},

                ]} maxFontSizeMultiplier={1.2}

              >

                {pair.answerText}

              </Text>

              {pair.gender && <Image source={getImageForGender(pair.gender)} style={styles.iconStyle} />}

            </TouchableOpacity>

          ))}

        </View>

      </Animated.View>

      <TouchableOpacity

        style={[styles.nextButton, nextButtonEnabled ? styles.nextButtonActive : styles.nextButtonInactive]}

        onPress={handleNextPress}

        disabled={!nextButtonEnabled}

      >

        <Text style={[styles.nextButtonText, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.next}</Text>

      </TouchableOpacity>

      {completionMessageVisible && (

        <Animated.View style={[styles.completionMessageContainer, { opacity: completionMessageOpacity }]}>

          <Completion

            handleOK={handleContinue} // Теперь вызывает handleContinue

            navigateToMenu={() => {

              setCompletionMessageVisible(false);

              goToMenu();

            }}

            correctAnswers={correctCount}

            incorrectAnswers={incorrectCount}

            correctAnswersPercentage={progressPercent.toFixed(2)}

            grade={getGrade(language, progressPercent)}

            restartTask={resetExercise}

          />

        </Animated.View>

      )}

      <Exit visible={exitConfirmationVisible} onCancel={handleCancelExit} onConfirm={handleConfirmExit} />

      </View>

    </ScrollView>

  );

};

const styles = StyleSheet.create({

 scrollViewContent: {

  flexGrow: 1,

  justifyContent: 'flex-start',

  alignItems: 'center',

  paddingTop: 0, // можно 0..6

},

  container: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    padding: 10,

    backgroundColor: '#AFC1D0',

    height: '100%',

    width: '100%',

  },

  completionMessageContainer: {

    position: 'absolute',

    top: 0,

    bottom: 0,

    left: 0,

    right: 0,

    justifyContent: 'center',

    alignItems: 'center',

  },

  topBar: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    width: '100%',

    paddingTop: 10,

  },

logoImage:{

  width:74,

  height:74,

  marginLeft:8

},

  buttonContainer: {

    flexDirection: 'row',

    marginRight: 10,

  },

buttonImage:{

  width:38,

  height:38,

  marginLeft:8

},

  progressContainer: {

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    width: '100%',

    height: 50,

    backgroundColor: '#6C8EBB',

    borderRadius: 10,

    marginBottom: 10,

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5,

  },

  textContainer: {

    flex: 1,

    justifyContent: 'center',

    width: '50%',

  },

  prtext: {

    fontSize: 12,

    color: 'white',

    textAlign: 'left',

    marginLeft: 15,

  },

  percentContainer: {

    alignItems: 'center',

    marginRight: 10,

  },

  percentText: {

    fontSize: 20,

    color: 'white',

    fontWeight: 'bold',

    textAlign: 'center',

    borderRadius: 10,

    alignItems: 'center',

    paddingLeft: 10,

    paddingRight: 10,

  },

  remainingTasksContainer: {

    alignItems: 'center',

    marginRight: 10,

  },

  remainingTasksText: {

    fontSize: 20,

    color: 'white',

    fontWeight: 'bold',

    textAlign: 'center',

    backgroundColor: '#83A3CD',

    borderRadius: 10,

    alignItems: 'center',

    paddingLeft: 10,

    paddingRight: 10,

  },

  ProgressBarcontainer: {

    width: '100%',

    marginBottom: 5

  },

  title: {

    fontSize: 18,

    fontWeight: 'bold',

    marginTop: 5,

    marginBottom: 5,

    color: '#2F4766',

    textAlign: 'center',

  },

  verbContainer: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 5,

    marginBottom: 10,

    backgroundColor: '#FFFDEF',

    borderRadius: 10,

    marginLeft: 5,

    marginRight: 5,

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5,

    height: 40,

    width: '100%',

  },

  verbText: {

    fontSize: 15,

    color: '#FF5757',

    fontWeight: 'bold',

    textAlign: 'center',

    marginLeft: 10,

  },

  verbTextTr: {

    fontSize: 16,

    color: '#333',

    textAlign: 'center',

  },

  verbTextRu: {

    fontSize: 15,

    color: '#003882',

    textAlign: 'center',

    width: 120, // Set a fixed width

  },

  verbTextActive: {

    fontSize: 14,

    color: 'white',

    textAlign: 'center',

  },

  translationButton: {

    backgroundColor: '#6C8EBB',

    paddingVertical: 5,

    paddingHorizontal: 5,

    borderRadius: 5,

    width: 120, // Set the same fixed width as verbTextRu

    alignItems: 'center',

  },

  audioIcon: {

    width: 26,

    height: 26,

    // marginRight: 20,

  },

  audioIcon1: {

    width: 22,

    height: 22,

    marginRight: 5,

  },

  audioButton: {

    position: 'absolute', // Абсолютное позиционирование

    bottom: 10, // Отступ снизу

    right: 14, // Отступ справа

  },

  hebrewCardContainer: {

    width: '100%',

    alignItems: 'center',

    marginVertical: 10,

  },

  hebrewCard: {

    minHeight: 80,

justifyContent: 'center',

    backgroundColor: '#FFFDEF',

    borderRadius: 10,

    padding: 20,

    width: '100%',

    alignItems: 'center',

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5,

  },

 hebrewTextBox: {

   height: HEBREW_LINE_H * HEBREW_LINES,

   justifyContent: 'center',

   alignItems: 'center',

   width: '100%',

 },

     hebrewText: {

   fontSize: HEBREW_FS,

   fontFamily: HEBREW_FONT,

   color: '#152039',

   textAlign: 'center',

   lineHeight: HEBREW_LINE_H,

   ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),

 },

  translitText: {

    fontSize: 20,

    lineHeight: 26, 

    color: '#FF5757',

    fontWeight: 'bold',

    marginTop: 1,

    textAlign: 'center',

  },

  row: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginVertical: 5,

    width: '100%',

  },

  answerContainer: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    width: '100%',

  },

  button: {

    width: '48%',

    marginVertical: 5,

    padding: 5,

    backgroundColor: '#D1E3F1',

    borderRadius: 10,

    justifyContent: 'center',

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5,

    flexWrap: 'wrap',

  },

  russianButton: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  text: {

    fontSize: 14,

    fontWeight: 'bold',

  },

  russianText: {

    textAlign: 'left',

    flex: 1,

    marginLeft: 3,

    color: '#152039',

  },

  iconStyle: {

    width: 45,

    height: 45,

  },

  selectedButton: {

    backgroundColor: '#AFFFCA',

  },

  correctButton: {

    backgroundColor: '#AFFFCA',

  },

  wrongButton: {

    backgroundColor: '#FFBCBC',

  },

  deactivatedButton: {

    backgroundColor: '#E0E0E0',

  },

  deactivatedButtonText: {

    color: '#A0A0A0',

  },

  verbContainerWrapper: {

    width: '100%',

    alignItems: 'center',

    marginVertical: 5,

    height: 40,

  },

  inactiveButton: {

    backgroundColor: '#E0E0E0',

    justifyContent: 'center',

    height: '100%',

    alignItems: 'center',

    width: '100%',

    marginLeft: 5,

    marginRight: 5,

  },

  activeButton: {

    backgroundColor: '#6C8EBB',

    justifyContent: 'center',

    height: '100%',

    alignItems: 'center',

    width: '100%',

    marginLeft: 5,

    marginRight: 5,

  },

  verbTextInactive: {

    fontSize: 14,

    color: '#A0A0A0',

    textAlign: 'center',

    fontWeight: 'bold',

  },

  verbTextActive: {

    fontSize: 14,

    color: 'white',

    textAlign: 'center',

    fontWeight: 'bold',

  },

  nextButton: {

    width: '80%',

    // height: 40,

    padding: hp('1.5%'),

    justifyContent: 'center',

    alignItems: 'center',

    borderRadius: 10,

    marginTop: 20,

    marginBottom: 20,

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5,

  },

  nextButtonActive: {

    backgroundColor: '#6C8EBB',

  },

  nextButtonInactive: {

    backgroundColor: '#E0E0E0',

  },

  nextButtonText: {

    color: 'white',

    fontSize: 16,

    fontWeight: 'bold',

  },

  // подсветка частей глагола

prefixYellow: { color: '#00a2ffff', fontFamily: HEBREW_FONT },

suffixGreen: { color: '#ff3ab3ff', fontFamily: HEBREW_FONT },

  lottie: {

    position: 'absolute',

    top: 8,

    left: 8,

    width: 32,

    height: 32,

  },

  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});

export default Exercise8Screen;
