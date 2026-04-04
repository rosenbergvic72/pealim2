// VerbListModal2.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
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

const VerbListModal2 = ({
  visible,
  language = 'ru',
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
    formsCount: 'Форм',
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

  if (!mainVerb) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>
              {headerTitle}
            </Text>

            <View style={styles.headerVerbRow}>
              <View style={styles.headerLeft}>
                <Text
                  style={styles.headerMeaning}
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                >
                  {mainVerb?.[dictionaryTranslationKey]}
                </Text>
              </View>

              <View style={styles.headerRight}>
                <Text
                  style={styles.headerInf}
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                >
                  {mainVerb?.infinitive}
                </Text>

                {mainVerb?.transliteration ? (
                  <Text
                    style={styles.headerTranslit}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                  >
                    {mainVerb.transliteration}
                  </Text>
                ) : null}
              </View>
            </View>

            {(verbs1Meta?.root || verbs1Meta?.binyan) ? (
              <View style={styles.headerMetaRow}>
                <View style={styles.headerMetaCol}>
                  {verbs1Meta?.root ? (
                    <Text
                      style={styles.headerMetaText}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                    >
                      <Text style={styles.headerMetaLabel}>
                        {grammarLabels.root}:{' '}
                      </Text>
                      {verbs1Meta.root}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.headerMetaCol}>
                  {verbs1Meta?.binyan ? (
                    <Text
                      style={styles.headerMetaText}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                    >
                      <Text style={styles.headerMetaLabel}>
                        {grammarLabels.binyan}:{' '}
                      </Text>
                      {verbs1Meta.binyan}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.tensePanel}>
            <View style={styles.tensePanelLeft}>
              <Text style={styles.tensePanelTitle}>{tenseLabels.title}</Text>

              <TouchableOpacity
                style={[
                  styles.tenseChipVertical,
                  selectedTenses.present && styles.tenseChipActive,
                  isBeVerb && styles.tenseChipDisabled,
                ]}
                onPress={() => toggleTense('present')}
                disabled={isBeVerb}
              >
                <Text
                  style={[
                    styles.tenseChipText,
                    selectedTenses.present && styles.tenseChipTextActive,
                    isBeVerb && styles.tenseChipTextDisabled,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {tenseLabels.present}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tenseChipVertical,
                  selectedTenses.past && styles.tenseChipActive,
                ]}
                onPress={() => toggleTense('past')}
              >
                <Text
                  style={[
                    styles.tenseChipText,
                    selectedTenses.past && styles.tenseChipTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {tenseLabels.past}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tenseChipVertical,
                  selectedTenses.future && styles.tenseChipActive,
                ]}
                onPress={() => toggleTense('future')}
              >
                <Text
                  style={[
                    styles.tenseChipText,
                    selectedTenses.future && styles.tenseChipTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {tenseLabels.future}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tensePanelRight}>
              <Text style={styles.formsCountLabel}>{tenseLabels.formsCount}</Text>
              <View style={styles.formsCountCircle}>
                <Text style={styles.formsCountValue}>{formsCount}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {filteredVerbs.map((form, idx) => {
              const translation =
                form?.[translationKey] ||
                form?.russiantext ||
                form?.entext ||
                '—';

              const hebRaw =
                typeof form?.hebrewtext === 'string'
                  ? form.hebrewtext
                  : String(form?.hebrewtext || '');

              const translitRaw =
                typeof form?.translit === 'string'
                  ? form.translit
                  : String(form?.translit || '');

              return (
                <View
                  key={`${hebRaw}-${form?._originalIndex}-${idx}`}
                  style={styles.row}
                >
                  <View style={styles.leftCol}>
                    {form?.gender ? (
                      <Image
                        source={getGenderIcon(form.gender)}
                        style={styles.genderIcon}
                      />
                    ) : null}

                    <Text
                      style={styles.leftText}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                    >
                      {translation}
                    </Text>
                  </View>

                  <View style={styles.rightCol}>
                    <View style={styles.hebrewRow}>
                      <Text
                        style={styles.hebrewText}
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
                        <Image
                          source={require('./speaker3.png')}
                          style={styles.speakerIcon}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={styles.verbTranslit}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                    >
                      {translitRaw}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() =>
                onStartExercise?.({
                  selectedTenses,
                  forms: filteredVerbs,
                  totalForms: filteredVerbs.length,
                })
              }
            >
              <Text style={styles.startButtonText} maxFontSizeMultiplier={1.2}>
                {buttonLabels.start}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.2}>
                {buttonLabels.close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getGenderIcon = (gender) => {
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '94%',
    maxHeight: Platform.OS === 'ios' ? '86%' : '94%',
    backgroundColor: '#F4F7FB',
    borderRadius: 20,
    padding: 10,
  },

  headerBlock: {
    backgroundColor: '#d9e5f4',
    borderRadius: 12,
    padding: 6,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2F4766',
    marginBottom: 4,
  },
  headerVerbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f9e9',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 6,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerMeaning: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00325c',
  },
  headerInf: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00325c',
  },
  headerTranslit: {
    marginTop: 0,
    fontSize: 11,
    fontWeight: '600',
    color: '#E03E38',
    textAlign: 'right',
    paddingRight: 1,
  },

  headerMetaRow: {
    marginTop: 3,
    backgroundColor: '#d9e5f4',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 2,
    flexDirection: 'row',
  },
  headerMetaCol: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMetaText: {
    fontSize: 11,
    color: 'black',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerMetaLabel: {
    fontWeight: '800',
    color: '#E03E38',
  },

  tensePanel: {
    backgroundColor: '#eef4fb',
    borderRadius: 10,
    padding: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tensePanelLeft: {
    flex: 1.25,
    marginRight: 6,
  },
  tensePanelRight: {
    width: 82,
    borderRadius: 10,
    backgroundColor: '#dde8f5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tensePanelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F4766',
    marginBottom: 4,
    textAlign: 'left',
  },
  tenseChipVertical: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#d7e2ef',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    marginBottom: 4,
  },
  tenseChipActive: {
    backgroundColor: '#2F4766',
  },
  tenseChipDisabled: {
    backgroundColor: '#e4e4e4',
    opacity: 0.7,
  },
  tenseChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F4766',
    textAlign: 'center',
  },
  tenseChipTextActive: {
    color: '#fff',
  },
  tenseChipTextDisabled: {
    color: '#8b8b8b',
  },
  formsCountLabel: {
    fontSize: 11,
    color: '#5c6d82',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  formsCountCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2F4766',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formsCountValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: 2,
  },

  row: {
    flexDirection: 'row',
    backgroundColor: '#E7F1FF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
    minHeight: 52,
  },

  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  genderIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  leftText: {
    flex: 1,
    fontSize: 13,
    color: '#1b2436',
    fontWeight: '500',
  },

  rightCol: {
    flex: 1.08,
    paddingLeft: 4,
    paddingRight: 2,
    justifyContent: 'center',
  },
  hebrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 1,
  },
  hebrewText: {
    fontSize: 15,
    color: '#152039',
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  speakerButton: {
    marginLeft: 4,
  },
  speakerIcon: {
    width: 18,
    height: 18,
  },

  verbTranslit: {
    fontSize: 12,
    color: '#E03E38',
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'right',
    paddingTop: 0,
    paddingRight: 2,
    flexShrink: 1,
  },

  prefixYellow: {
    color: '#00a2ff',
  },
  suffixGreen: {
    color: '#fe65c3',
  },

  footer: {
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#2F4766',
    borderRadius: 12,
    paddingVertical: 9,
    marginBottom: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    borderRadius: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#2F4766',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VerbListModal2;