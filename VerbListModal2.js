// VerbListModal2.jsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform, // ✅ добавили
} from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';

// ✅ берем root/binyan отсюда
import verbs1Data from './verbs1.json';


const FONT_REG = 'mt-regular';
const FONT_MED = 'mt-medium';
const FONT_BOLD = 'mt-bold';
const FONT_SEMIBOLD = 'mt-semibold';

// props:
// visible, language, verbs, onStartExercise, onClose
const VerbListModal2 = ({
  visible,
  language = 'ru',
  verbs = [],
  onStartExercise,
  onClose,
}) => {
  const [sound, setSound] = useState(null);

  // ✅ Не мутируем исходные объекты
  const safeVerbs = useMemo(
    () => (Array.isArray(verbs) ? verbs.map((v) => ({ ...v })) : []),
    [verbs]
  );

  /* === НОРМАЛИЗАЦИЯ ЯЗЫКА === */
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

  /* === ЗАГОЛОВОК МОДАЛКИ === */
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

  /* === ПОЛЕ ДЛЯ ПЕРЕВОДА ОСНОВНОГО ГЛАГОЛА (в шапке) === */
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

  /* === ПОЛЕ ДЛЯ ПЕРЕВОДА ФОРМ (левая колонка) === */
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

  // 🔹 Подписи кнопок для всех языков
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

  // ✅ подписи Root/Binyan
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

  const headerTitle = headerTitleByLang[langCode] || headerTitleByLang.ru;
  const dictionaryTranslationKey =
    dictionaryTranslationFieldMap[langCode] || 'russian';
  const translationKey = translationFieldMap[langCode] || 'russiantext';
  const buttonLabels = buttonLabelsByLang[langCode] || buttonLabelsByLang.ru;
  const grammarLabels = grammarLabelsByLang[langCode] || grammarLabelsByLang.ru;

  const mainVerb = safeVerbs[0];

  /* ===================== FIND ROOT + BINYAN FROM verbs1.json ===================== */

  const normalize = (s) => String(s || '').trim().toLowerCase();

  const verbs1Meta = useMemo(() => {
    if (!mainVerb) return null;

    const inf = String(mainVerb.infinitive || '').trim(); // например "ללכת"
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

  // ✅ биньян NIF'AL / NIFAL (нормализация: убираем пробелы и апострофы)
  const isNifal = useMemo(() => {
    const b = normalize(verbs1Meta?.binyan).replace(/[\s’']/g, '');
    return b === 'nifal'; // покрывает NIF'AL / NIFAL
  }, [verbs1Meta?.binyan]);

  /* ============================================================================ */

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

  /* ===================== HEBREW HIGHLIGHTING ===================== */

  // суффиксы настоящего (длинные — раньше)
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

  const renderHebrewText = (hebrewtext, idx) => {
    const pos = idx + 1; // 1..36
    const raw = String(hebrewtext || '');

    const isBeVerb = String(mainVerb?.infinitive || '') === 'להיות';
    const virtualPos = isBeVerb ? pos + 12 : pos;

    // ✅ применять правило нифаля только для 1..24
    const applyNifalNun = isNifal && virtualPos >= 1 && virtualPos <= 24;

    // ✅ "добавка" для нифаля: подсветить первую נ, НЕ ломая остальную подсветку
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
          {before}
          {' '}
          {renderWordFn(verb)}
        </>
      );
    };

    const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {
      const w = String(word || '');
      const prefix = w.startsWith('ה') ? 'ה' : '';
      return renderWithColorRules(w, { prefix, suffix: suffix || '' });
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

    if (virtualPos === 17)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ה'))
      );

    if (virtualPos === 18)
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

    // ====== 25..36 (будущее): твои существующие правила ======
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

  /* =============================================================== */

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
          {/* HEADER */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>
              {headerTitle}
            </Text>

            <View style={styles.headerVerbRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerMeaning} maxFontSizeMultiplier={1.2}>
                  {mainVerb?.[dictionaryTranslationKey]}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.headerInf} maxFontSizeMultiplier={1.2}>
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

            {/* ✅ Root + Binyan (в ряд, 50/50) */}
            {verbs1Meta?.root || verbs1Meta?.binyan ? (
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

          {/* LIST */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {safeVerbs.map((form, idx) => {
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
                <View key={`${hebRaw}-${idx}`} style={styles.row}>
                  {/* LEFT: ICON + TRANSLATION */}
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
                      numberOfLines={2}
                    >
                      {translation}
                    </Text>
                  </View>

                  {/* RIGHT: HEBREW + SPEAKER + TRANSLIT */}
                  <View style={styles.rightCol}>
                    <View style={styles.hebrewRow}>
                      <Text
                        style={styles.hebrewText}
                        maxFontSizeMultiplier={1.2}
                        numberOfLines={1}
                      >
                        {renderHebrewText(hebRaw, idx)}
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
                      numberOfLines={2}
                    >
                      {translitRaw}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* BUTTONS */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartExercise}
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

  // ✅ ЕДИНСТВЕННАЯ ПРАВКА: maxHeight меньше на iOS (Android не трогаем)
  modalCard: {
    width: '94%',
    maxHeight: Platform.OS === 'ios' ? '86%' : '94%',
    backgroundColor: '#F4F7FB',
    borderRadius: 20,
    padding: 12,
  },

  /* HEADER */
  headerBlock: {
    backgroundColor: '#d9e5f4',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2F4766',
    marginBottom: 8,
  },
  headerVerbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f9e9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  headerMeaning: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00325c',
  },
  headerInf: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00325c',
  },
  headerTranslit: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#E03E38',
    textAlign: 'right',
    paddingRight: 4,
  },

  // ✅ Root/Binyan row 50/50
  headerMetaRow: {
    marginTop: 6,
    backgroundColor: '#d9e5f4',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    flexDirection: 'row',
  },
  headerMetaCol: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMetaText: {
    fontSize: 14,
    color: 'black',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerMetaLabel: {
    fontWeight: '800',
    color: '#E03E38',
  },

  /* LIST */
  list: { flexGrow: 0 },
  listContent: { paddingVertical: 4 },

  row: {
    flexDirection: 'row',
    backgroundColor: '#E7F1FF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  genderIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  leftText: {
    flex: 1,
    fontSize: 15,
    color: '#1b2436',
  },

  rightCol: {
    flex: 1.1,
    paddingLeft: 6,
    paddingRight: 4,
  },
  hebrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  hebrewText: {
    fontSize: 17,
    color: '#152039',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  speakerButton: { marginLeft: 6 },
  speakerIcon: {
    width: 22,
    height: 22,
  },

  verbTranslit: {
    fontSize: 15,
    color: '#E03E38',
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'right',
    paddingTop: 1,
    paddingRight: 4,
    flexShrink: 1,
  },

  /* === HIGHLIGHT COLORS === */
  prefixYellow: {
    color: '#00a2ffff',
  },
  suffixGreen: {
    color: '#fe65c3',
  },

  /* FOOTER */
  footer: { marginTop: 6 },
  startButton: {
    backgroundColor: '#2F4766',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#2F4766',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VerbListModal2;
