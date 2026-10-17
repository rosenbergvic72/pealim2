// VerbFormsStartScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import verbs1Data from './verbs1.json';
const VerbFormsStartScreen = ({
  language = 'ru',
  exerciseNumber = 5,
  verbs = [],
  onStartExercise,
  onClose,
}) => {
  const [sound, setSound] = useState(null);
  const isBeVerb = String(verbs?.[0]?.infinitive || '').trim() === 'להיות';
  const [selectedTenses, setSelectedTenses] = useState({
    present: !isBeVerb,
    past: true,
    future: true,
  });
  useEffect(() => {
    const beVerb = String(verbs?.[0]?.infinitive || '').trim() === 'להיות';
    setSelectedTenses({
      present: !beVerb,
      past: true,
      future: true,
    });
  }, [verbs]);
  const safeVerbs = useMemo(
    () =>
      Array.isArray(verbs)
        ? verbs.map((v, index) => ({
            ...v,
            _originalIndex: index,
          }))
        : [],
    [verbs]
  );
  const languageMap = {
    ru: 'ru',
    en: 'en',
    fr: 'fr',
    es: 'es',
    pt: 'pt',
    ar: 'ar',
    am: 'am',
    he: 'he',
    русский: 'ru',
    english: 'en',
    français: 'fr',
    español: 'es',
    português: 'pt',
    العربية: 'ar',
    አማርኛ: 'am',
    עברית: 'he',
  };
  const langCode = languageMap[language] || language || 'ru';
  const headerTitleByLang = {
    ru: 'Глагол упражнения и спряжения',
    en: 'Exercise verb & conjugations',
    fr: "Verbe de l’exercice et conjugaisons",
    es: 'Verbo del ejercicio y conjugaciones',
    pt: 'Verbo do exercício e conjugações',
    ar: 'فعل التمرين والتصريفات',
    am: 'ግስ እና ልዩ ልዩ ቅጾች',
    he: 'הפועל בתרגיל והטיותיו',
  };
  const dictionaryTranslationFieldMap = {
    ru: 'russian',
    en: 'english',
    fr: 'french',
    es: 'spanish',
    pt: 'portu',
    ar: 'arabic',
    am: 'amharic',
    he: 'hebrew',
  };
  const translationFieldMap = {
    ru: 'russiantext',
    en: 'entext',
    fr: 'frtext',
    es: 'estext',
    pt: 'pttext',
    ar: 'artext',
    am: 'amtext',
    he: 'hebrewtext',
  };
  const buttonLabelsByLang = {
    ru: { start: 'Начать упражнение', close: 'Закрыть' },
    en: { start: 'Start exercise', close: 'Close' },
    fr: { start: "Commencer l'exercice", close: 'Fermer' },
    es: { start: 'Empezar el ejercicio', close: 'Cerrar' },
    pt: { start: 'Iniciar exercício', close: 'Fechar' },
    ar: { start: 'بدء التمرين', close: 'إغلاق' },
    am: { start: 'መልምድ ጀምር', close: 'ዝጋ' },
    he: { start: 'התחל תרגול', close: 'סגור' },
  };
  const grammarLabelsByLang = {
    ru: { root: 'Корень', binyan: 'Биньян' },
    en: { root: 'Root', binyan: 'Binyan' },
    fr: { root: 'Racine', binyan: 'Binyan' },
    es: { root: 'Raíz', binyan: 'Binyan' },
    pt: { root: 'Raiz', binyan: 'Binyan' },
    ar: { root: 'الجذر', binyan: 'البنيان' },
    am: { root: 'ሥር', binyan: 'ቢንያን' },
    he: { root: 'שורש', binyan: 'בניין' },
  };
  const tenseLabelsByLang = {
  ru: {
    title: 'Выберите времена и формы',
    present: 'Настоящее',
    past: 'Прошедшее',
    future: 'Будущее',
    formsCount: 'Формы',
  },
  en: {
    title: 'Choose tenses and forms',
    present: 'Present',
    past: 'Past',
    future: 'Future',
    formsCount: 'Forms',
  },
  fr: {
    title: 'Choisissez les temps et les formes',
    present: 'Présent',
    past: 'Passé',
    future: 'Futur',
    formsCount: 'Formes',
  },
  es: {
    title: 'Elige tiempos y formas',
    present: 'Presente',
    past: 'Pasado',
    future: 'Futuro',
    formsCount: 'Formas',
  },
  pt: {
    title: 'Escolha tempos e formas',
    present: 'Presente',
    past: 'Passado',
    future: 'Futuro',
    formsCount: 'Formas',
  },
  ar: {
    title: 'اختر الأزمنة والصيغ',
    present: 'المضارع',
    past: 'الماضي',
    future: 'المستقبل',
    formsCount: 'الصيغ',
  },
  am: {
    title: 'ጊዜያትን እና ቅጾችን ይምረጡ',
    present: 'አሁን',
    past: 'ያለፈ',
    future: 'ወደፊት',
    formsCount: 'ቅጾች',
  },
  he: {
    title: 'בחרו זמנים וצורות',
    present: 'הווה',
    past: 'עבר',
    future: 'עתיד',
    formsCount: 'צורות',
  },
};
  const headerTitle = headerTitleByLang[langCode] || headerTitleByLang.ru;
  const dictionaryTranslationKey =
    dictionaryTranslationFieldMap[langCode] || 'russian';
  const translationKey = translationFieldMap[langCode] || 'russiantext';
  const buttonLabels = buttonLabelsByLang[langCode] || buttonLabelsByLang.ru;
  const grammarLabels = grammarLabelsByLang[langCode] || grammarLabelsByLang.ru;
  const tenseLabels = tenseLabelsByLang[langCode] || tenseLabelsByLang.ru;
  const mainVerb = safeVerbs[0];
  const normalize = (s) => String(s || '').trim().toLowerCase();
  const verbs1Meta = useMemo(() => {
    if (!mainVerb) return null;
    const inf = String(mainVerb.infinitive || '').trim();
    const tr = normalize(mainVerb.transliteration);
    const af = normalize(mainVerb.audioFile);
    let found =
      Array.isArray(verbs1Data)
        ? verbs1Data.find((v) => String(v?.hebrewVerb || '').trim() === inf)
        : null;
    if (!found && tr) {
      found = verbs1Data.find((v) => normalize(v?.transliteration) === tr);
    }
    if (!found && af) {
      found = verbs1Data.find((v) => normalize(v?.audioFile) === af);
    }
    if (!found) return null;
    return {
      root: found.root || '',
      binyan: found.binyan || '',
    };
  }, [mainVerb]);
  const isNifal = useMemo(() => {
    const b = normalize(verbs1Meta?.binyan).replace(/[\s’']/g, '');
    return b === 'nifal';
  }, [verbs1Meta?.binyan]);
  const getTenseByIndex = (index, totalLength, beVerb = false) => {
    // Обычные глаголы: 36 = 12 present + 12 past + 12 future
    if (!beVerb) {
      if (index >= 0 && index <= 11) return 'present';
      if (index >= 12 && index <= 23) return 'past';
      if (index >= 24 && index <= 35) return 'future';
      return null;
    }
    // להיות: настоящего нет
    // Если реально пришло 24 формы:
    // 0..11 = past
    // 12..23 = future
    if (totalLength === 24) {
      if (index >= 0 && index <= 11) return 'past';
      if (index >= 12 && index <= 23) return 'future';
      return null;
    }
    // fallback на случай нестандартной структуры данных
    if (index >= 12 && index <= 23) return 'past';
    if (index >= 24 && index <= 35) return 'future';
    return null;
  };
  const filteredVerbs = useMemo(() => {
    const totalLength = safeVerbs.length;
    return safeVerbs.filter((form) => {
      const tense = getTenseByIndex(form._originalIndex, totalLength, isBeVerb);
      return !!selectedTenses[tense];
    });
  }, [safeVerbs, selectedTenses, isBeVerb]);
  const formsCount = filteredVerbs.length;
  const toggleTense = (tenseKey) => {
    if (tenseKey === 'present' && isBeVerb) return;
    const nextState = {
      ...selectedTenses,
      [tenseKey]: !selectedTenses[tenseKey],
    };
    const activeKeys = Object.entries(nextState)
      .filter(([, value]) => value)
      .map(([key]) => key);
    // Нельзя отключить вообще всё
    if (activeKeys.length === 0) {
      return;
    }
    setSelectedTenses(nextState);
  };
  const playConjAudio = useCallback(
    async (mp3Key) => {
      try {
        if (!mp3Key) return;
        const key = String(mp3Key).replace('.mp3', '');
        const audioFile = soundsconj[key];
        if (!audioFile) {
          console.warn('⚠️ Audio not found for key:', key);
          return;
        }
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        await newSound.playAsync();
      } catch (e) {
        console.error('Error playing sound', e);
      }
    },
    [sound]
  );
  const PRESENT_SUFFIXES = ['ות', 'ים', 'ה', 'ת'];
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
  const renderWithColorRules = (word, { prefix = '', suffix = '' }) => {
    const w = String(word || '');
    if (!w) return '';
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
      </>
    );
  };
  const renderPresentVerbWord = (verbWord) => {
    const verb = String(verbWord || '');
    if (!verb) return '';
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
        </>
      );
    }
    const base = restWord.slice(0, restWord.length - matchedSuffix.length);
    return (
      <>
        {prefixNode}
        {base}
        {green(matchedSuffix, 'suf')}
      </>
    );
  };
  const renderHebrewText = (hebrewtext, originalIndex) => {
    const pos = Number(originalIndex) + 1;
    const raw = String(hebrewtext || '');
    const isCurrentBeVerb = String(mainVerb?.infinitive || '') === 'להיות';
    const virtualPos = isCurrentBeVerb ? pos + 12 : pos;
    const applyNifalNun = isNifal && virtualPos >= 1 && virtualPos <= 24;
    const withOptionalNifalNun = (word, renderFn) => {
      const w = String(word || '');
      if (!w) return '';
      if (applyNifalNun && w.startsWith('נ')) {
        const rest = w.slice(1);
        const renderedRest = renderFn ? renderFn(rest) : rest;
        return (
          <>
            {yellow('נ', 'nifal-nun')}
            {renderedRest}
          </>
        );
      }
      return renderFn ? renderFn(w) : w;
    };
    const applyToVerbWord = (text, renderWordFn) => {
      const parts = String(text || '').split(' ').filter(Boolean);
      if (parts.length <= 1) return renderWordFn(parts[0] || '');
      const verb = parts[parts.length - 1];
      const before = parts.slice(0, -1).join(' ');
      return (
        <>
          {before}{' '}
          {renderWordFn(verb)}
        </>
      );
    };
    const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {
      const w = String(word || '');
      const prefix = w.startsWith('ה') ? 'ה' : '';
      return renderWithColorRules(w, { prefix, suffix: suffix || '' });
    };
    if (!isCurrentBeVerb && virtualPos >= 1 && virtualPos <= 12) {
      const parts = raw.split(' ');
      if (parts.length < 2) {
        return withOptionalNifalNun(parts[0] || '', (x) =>
          renderPresentVerbWord(x)
        );
      }
      const first = parts[0];
      const verb = parts[1];
      const tail = parts.slice(2).join(' ');
      return (
        <>
          {first}{' '}
          {withOptionalNifalNun(verb, (x) => renderPresentVerbWord(x))}
          {tail ? ` ${tail}` : ''}
        </>
      );
    }
    if (virtualPos === 13 || virtualPos === 14)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'תי')
        )
      );
    if (virtualPos === 15 || virtualPos === 16)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'ת')
        )
      );
    if (virtualPos === 17)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'ה')
        )
      );
    if (virtualPos === 18)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'ה')
        )
      );
    if (virtualPos === 19 || virtualPos === 20)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'נו')
        )
      );
    if (virtualPos === 21)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'תם')
        )
      );
    if (virtualPos === 22)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'תן')
        )
      );
    if (virtualPos === 23 || virtualPos === 24)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) =>
          renderPastWithHitpaelPrefixAndSuffix(rest, 'ו')
        )
      );
    if (virtualPos === 25) return renderWithColorRules(raw, { prefix: 'א' });
    if (virtualPos === 26) return renderWithColorRules(raw, { prefix: 'א' });
    if (virtualPos === 27) return renderWithColorRules(raw, { prefix: 'ת' });
    if (virtualPos === 28)
      return renderWithColorRules(raw, { prefix: 'ת', suffix: 'י' });
    if (virtualPos === 29) return renderWithColorRules(raw, { prefix: 'י' });
    if (virtualPos === 30) return renderWithColorRules(raw, { prefix: 'ת' });
    if (virtualPos === 31 || virtualPos === 32)
      return renderWithColorRules(raw, { prefix: 'נ' });
    if (virtualPos === 33 || virtualPos === 34)
      return renderWithColorRules(raw, { prefix: 'ת', suffix: 'ו' });
    if (virtualPos === 35 || virtualPos === 36)
      return renderWithColorRules(raw, { prefix: 'י', suffix: 'ו' });
    return raw;
  };
  const screenTitleByLang = {
    ru: `Упражнение ${exerciseNumber}`,
    en: `Exercise ${exerciseNumber}`,
    fr: `Exercice ${exerciseNumber}`,
    es: `Ejercicio ${exerciseNumber}`,
    pt: `Exercício ${exerciseNumber}`,
    ar: `التمرين ${exerciseNumber}`,
    am: `ልምምድ ${exerciseNumber}`,
    he: `תרגיל ${exerciseNumber}`,
  };
  const backLabelByLang = {
    ru: 'Назад',
    en: 'Back',
    fr: 'Retour',
    es: 'Atrás',
    pt: 'Voltar',
    ar: 'رجوع',
    am: 'ተመለስ',
    he: 'חזרה',
  };
  const verbLabelByLang = {
    ru: 'Глагол упражнения',
    en: 'Exercise verb',
    fr: "Verbe de l’exercice",
    es: 'Verbo del ejercicio',
    pt: 'Verbo do exercício',
    ar: 'فعل التمرين',
    am: 'የልምምዱ ግስ',
    he: 'פועל התרגיל',
  };
  const screenTitle = screenTitleByLang[langCode] || screenTitleByLang.ru;
  const backLabel = backLabelByLang[langCode] || backLabelByLang.ru;
  const verbLabel = verbLabelByLang[langCode] || verbLabelByLang.ru;
  const isRTL = langCode === 'ar' || langCode === 'he';
  if (!mainVerb) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>…</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pageHeader}>
        <Text
          style={[styles.pageTitle, isRTL && styles.rtlText]}
          maxFontSizeMultiplier={1.2}
        >
          {headerTitle}
        </Text>
      </View>
      <View style={styles.verbSection}>
        <View style={[styles.verbMainRow, isRTL && styles.rowReverse]}>
          <View style={[styles.meaningBlock, isRTL && styles.alignRight]}>
            <Text
              style={[styles.sectionLabel, isRTL && styles.rtlText]}
              maxFontSizeMultiplier={1.2}
            >
              {verbLabel}
            </Text>
            <Text
              style={[styles.meaningText, isRTL && styles.rtlText]}
              maxFontSizeMultiplier={1.2}
              numberOfLines={2}
            >
              {mainVerb?.[dictionaryTranslationKey] || '—'}
            </Text>
          </View>
          <View style={styles.hebrewBlock}>
            <Text
              style={styles.infinitiveText}
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
            >
              {mainVerb?.infinitive || ''}
            </Text>
            {!!mainVerb?.transliteration && (
              <Text
                style={styles.infinitiveTranslit}
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
              >
                {mainVerb.transliteration}
              </Text>
            )}
          </View>
        </View>
        {(verbs1Meta?.root || verbs1Meta?.binyan) ? (
          <View style={[styles.metaRow, isRTL && styles.rowReverse]}>
            {!!verbs1Meta?.root && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                  {grammarLabels.root}
                </Text>
                <Text style={styles.metaValue} maxFontSizeMultiplier={1.2}>
                  {verbs1Meta.root}
                </Text>
              </View>
            )}
            {!!verbs1Meta?.binyan && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                  {grammarLabels.binyan}
                </Text>
                <Text style={styles.metaValue} maxFontSizeMultiplier={1.2}>
                  {verbs1Meta.binyan}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
      <View style={styles.tenseSection}>
        <View style={[styles.tenseHeaderRow, isRTL && styles.rowReverse]}>
          <Text
            style={[styles.tenseHeader, isRTL && styles.rtlText]}
            maxFontSizeMultiplier={1.2}
          >
            {tenseLabels.title}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber} maxFontSizeMultiplier={1.2}>{formsCount}</Text>
            <Text style={styles.countLabel} maxFontSizeMultiplier={1.2}>{tenseLabels.formsCount}</Text>
          </View>
        </View>
        <View style={[styles.tenseRow, isRTL && styles.rowReverse]}>
          {[
            ['present', tenseLabels.present, isBeVerb],
            ['past', tenseLabels.past, false],
            ['future', tenseLabels.future, false],
          ].map(([key, label, disabled]) => {
            const active = !!selectedTenses[key];
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tenseButton,
                  active && styles.tenseButtonActive,
                  disabled && styles.tenseButtonDisabled,
                ]}
                onPress={() => toggleTense(key)}
                disabled={disabled}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tenseButtonText,
                    active && styles.tenseButtonTextActive,
                    disabled && styles.tenseButtonTextDisabled,
                  ]}
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.formsSection}>
        <View style={styles.formsHeader}>
          <Text
            style={[styles.formsHeaderText, isRTL && styles.rtlText]}
            maxFontSizeMultiplier={1.2}
          >
            {tenseLabels.formsCount}
          </Text>
        </View>
        <ScrollView
          style={styles.formsList}
          contentContainerStyle={styles.formsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredVerbs.map((form, idx) => {
            const translation =
              form?.[translationKey] ||
              form?.russiantext ||
              form?.entext ||
              '—';
            const hebRaw = String(form?.hebrewtext || '');
            const translitRaw = String(form?.translit || '');
            return (
              <View
                key={`${hebRaw}-${form?._originalIndex}-${idx}`}
                style={[styles.formRow, isRTL && styles.rowReverse]}
              >
                <View style={[styles.translationSide, isRTL && styles.rowReverse]}>
                  {!!form?.gender && (
                    <Image source={getGenderIcon(form.gender)} style={styles.genderIcon} />
                  )}
                  <Text
                    style={[styles.translationText, isRTL && styles.rtlText]}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={2}
                  >
                    {translation}
                  </Text>
                </View>
                <View style={styles.hebrewSide}>
                  <View style={styles.hebrewLine}>
                    <Text
                      style={styles.formHebrew}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                    >
                      {renderHebrewText(hebRaw, form._originalIndex)}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        playConjAudio(
                          form?.mp3 ||
                            form?.mp3Inf ||
                            form?.mp3Conj ||
                            form?.audioFile
                        )
                      }
                      style={styles.speakerButton}
                    >
                      <Image source={require('./speaker3.png')} style={styles.speakerIcon} />
                    </TouchableOpacity>
                  </View>
                  {!!translitRaw && (
                    <Text
                      style={styles.formTranslit}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                    >
                      {translitRaw}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() =>
            onStartExercise?.({
              selectedTenses,
              forms: filteredVerbs,
              totalForms: filteredVerbs.length,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText} maxFontSizeMultiplier={1.2}>
            {buttonLabels.start}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const getGenderIcon = (gender) => {
  switch (gender) {
    case 'man': return require('./man1.png');
    case 'woman': return require('./woman1.png');
    case 'men': return require('./men1.png');
    case 'women': return require('./women1.png');
    default: return null;
  }
};
const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', backgroundColor: '#83A3CD' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#83A3CD' },
  loadingText: { fontSize: 32, color: '#FFFDEF', fontWeight: '800' },
  pageHeader: { width: '100%', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 9, backgroundColor: '#83A3CD' },
  pageTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600', color: '#FFFDEF', textAlign: 'center' },
  verbSection: { width: 'auto', marginHorizontal: 14, paddingHorizontal: 13, paddingTop: 9, paddingBottom: 9, backgroundColor: '#FFFDEF', borderRadius: 18, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 },
  sectionLabel: { marginBottom: 3, fontSize: 11, fontWeight: '800', color: '#73788F', textAlign: 'left' },
  verbMainRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  meaningBlock: {
    flex: 1,
    paddingRight: 8,
  },
  hebrewBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  meaningText: { fontSize: 17, lineHeight: 21, fontWeight: '800', color: '#333652', textAlign: 'left' },
  infinitiveText: { fontSize: 25, lineHeight: 30, fontFamily: Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold', color: '#333652', textAlign: 'right' },
  infinitiveTranslit: { marginTop: 1, fontSize: 13, fontWeight: '700', color: '#CE6857', textAlign: 'right' },
  metaRow: { flexDirection: 'row', marginTop: 7, borderTopWidth: 1, borderTopColor: '#E5E0DA', paddingTop: 6 },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  metaLabel: { fontSize: 11, color: '#73788F', fontWeight: '800' },
  metaValue: { marginTop: 1, fontSize: 14, color: '#333652', fontWeight: '900', textAlign: 'center' },
  tenseSection: { width: 'auto', marginHorizontal: 14, marginTop: 8, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 10, backgroundColor: '#FFFDEF', borderRadius: 18, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 },
  tenseHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  tenseHeader: { flex: 1, fontSize: 14, fontWeight: '700', color: '#333652', textAlign: 'left' },
  countBadge: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 8, paddingVertical: 3, marginLeft: 7, borderRadius: 12, backgroundColor: '#F5EBE4' },
  countNumber: { fontSize: 15, fontWeight: '800', color: '#CE6857' },
  countLabel: { marginLeft: 4, fontSize: 11, fontWeight: '800', color: '#73788F' },
  tenseRow: {
    flexDirection: 'row',
  },
  tenseButton: { flex: 1, minHeight: 38, marginHorizontal: 3, borderRadius: 11, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D7DCE6', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tenseButtonActive: { backgroundColor: '#CE6857', borderColor: '#CE6857' },
  tenseButtonDisabled: { opacity: 0.4 },
  tenseButtonText: { fontSize: 12, color: '#333652', fontWeight: '700', textAlign: 'center' },
  tenseButtonTextActive: { color: '#FFFDEF' },
  tenseButtonTextDisabled: { color: '#73788F' },
  formsSection: { flex: 1, minHeight: 0, width: 'auto', marginHorizontal: 14, marginTop: 10, backgroundColor: '#FFFDEF', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  formsHeader: { minHeight: 39, justifyContent: 'center', paddingHorizontal: 15, backgroundColor: '#F7F0E9', borderBottomWidth: 1, borderBottomColor: '#E7DFD8' },
  formsHeaderText: { fontSize: 13, fontWeight: '900', color: '#333652', textTransform: 'uppercase' },
  formsList: {
    flex: 1,
  },
  formsListContent: { paddingBottom: 10 },
  formRow: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#FFFDEF', borderBottomWidth: 1, borderBottomColor: '#EAE4DE' },
  translationSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  genderIcon: { width: 27, height: 27, marginRight: 6 },
  translationText: { flex: 1, fontSize: 14, lineHeight: 18, color: '#333652', fontWeight: '700', textAlign: 'left' },
  hebrewSide: {
    flex: 1.08,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  hebrewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  formHebrew: { flexShrink: 1, fontSize: 17, lineHeight: 21, fontFamily: Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold', color: '#333652', textAlign: 'right' },
  formTranslit: { marginTop: 2, fontSize: 12, color: '#CE6857', fontWeight: '700', fontStyle: 'italic', textAlign: 'right' },
  speakerButton: {
    marginLeft: 6,
    padding: 3,
  },
  speakerIcon: { width: 21, height: 21 },
  prefixYellow: {
    color: '#00a2ff',
  },
  suffixGreen: {
    color: '#fe65c3',
  },
  bottomBar: { width: '100%', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, backgroundColor: '#83A3CD' },
  startButton: { width: '100%', minHeight: 54, borderRadius: 15, backgroundColor: '#CE6857', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.17, shadowRadius: 5, elevation: 4 },
  startButtonText: { color: '#FFFDEF', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
export default VerbFormsStartScreen;
