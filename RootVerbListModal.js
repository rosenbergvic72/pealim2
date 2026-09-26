import React, { memo, useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getRootVerbKey,
  normalizeRootLanguage,
} from './RootVerbRotationModal';

const COLORS = {
  background: '#83A3CD',
  card: '#FFFDEF',
  text: '#333652',
  muted: '#73788F',
  selected: '#CE6857',
  selectedText: '#FFFDEF',
  option: '#FFFFFF',
  optionBorder: '#D7DCE6',
  divider: 'rgba(51,54,82,0.1)',
  shadow: '#000000',
};

const TEXTS = {
  ru: {
    title: 'Корни и биньяны',
    direction: 'Направление перевода',
    forward: 'Иврит → русский',
    reverse: 'Русский → иврит',
    count: 'Количество заданий',
    families: 'Выбери семейство однокоренных глаголов',
    sizes: { 2: '2 глагола', 3: '3 глагола', 4: '4 глагола' },
    all: 'Все',
    availableFamilies: 'Доступно семейств',
    availableVerbs: 'Глаголов для заданий',
    repeat: 'Некоторые глаголы повторятся: заданий больше, чем доступных глаголов.',
    empty: 'Для выбранных параметров нет доступных заданий.',
    tipTitle: 'Один корень — разные биньяны — разные действия.',
    tip: 'Сравнивай глаголы, замечай разницу в значениях и учись выбирать нужное слово в речи.',
    start: 'НАЧАТЬ',
  },
  en: {
    title: 'Roots and Binyanim',
    direction: 'Translation direction',
    forward: 'Hebrew → English',
    reverse: 'English → Hebrew',
    count: 'Number of tasks',
    families: 'Choose a family of verbs sharing a root',
    sizes: { 2: '2 verbs', 3: '3 verbs', 4: '4 verbs' },
    all: 'All',
    availableFamilies: 'Available families',
    availableVerbs: 'Verbs available for tasks',
    repeat: 'Some verbs will repeat: there are more tasks than available verbs.',
    empty: 'No tasks available for the selected settings.',
    tipTitle: 'One root — different binyanim — different actions.',
    tip: 'Compare verbs, notice differences in meaning and learn to choose the right word when speaking.',
    start: 'START',
  },
  fr: {
    title: 'Racines et binyanim',
    direction: 'Sens de traduction',
    forward: 'Hébreu → français',
    reverse: 'Français → hébreu',
    count: 'Nombre d’exercices',
    families: 'Choisissez une famille de verbes de même racine',
    sizes: { 2: '2 verbes', 3: '3 verbes', 4: '4 verbes' },
    all: 'Toutes',
    availableFamilies: 'Familles disponibles',
    availableVerbs: 'Verbes disponibles',
    repeat: 'Certains verbes seront répétés : il y a plus d’exercices que de verbes disponibles.',
    empty: 'Aucun exercice disponible pour ces paramètres.',
    tipTitle: 'Une racine — différents binyanim — différentes actions.',
    tip: 'Comparez les verbes, repérez les différences de sens et apprenez à choisir le mot juste à l’oral.',
    start: 'COMMENCER',
  },
  es: {
    title: 'Raíces y binyanim',
    direction: 'Dirección de traducción',
    forward: 'Hebreo → español',
    reverse: 'Español → hebreo',
    count: 'Número de ejercicios',
    families: 'Elige una familia de verbos con la misma raíz',
    sizes: { 2: '2 verbos', 3: '3 verbos', 4: '4 verbos' },
    all: 'Todas',
    availableFamilies: 'Familias disponibles',
    availableVerbs: 'Verbos disponibles',
    repeat: 'Algunos verbos se repetirán: hay más ejercicios que verbos disponibles.',
    empty: 'No hay ejercicios disponibles con estos ajustes.',
    tipTitle: 'Una raíz — distintos binyanim — distintas acciones.',
    tip: 'Compara los verbos, observa las diferencias de significado y aprende a elegir la palabra adecuada al hablar.',
    start: 'EMPEZAR',
  },
  pt: {
    title: 'Raízes e binyanim',
    direction: 'Direção da tradução',
    forward: 'Hebraico → português',
    reverse: 'Português → hebraico',
    count: 'Número de exercícios',
    families: 'Escolha uma família de verbos com a mesma raiz',
    sizes: { 2: '2 verbos', 3: '3 verbos', 4: '4 verbos' },
    all: 'Todas',
    availableFamilies: 'Famílias disponíveis',
    availableVerbs: 'Verbos disponíveis',
    repeat: 'Alguns verbos serão repetidos: há mais exercícios do que verbos disponíveis.',
    empty: 'Não há exercícios disponíveis para estas definições.',
    tipTitle: 'Uma raiz — diferentes binyanim — diferentes ações.',
    tip: 'Compare os verbos, observe as diferenças de significado e aprenda a escolher a palavra certa ao falar.',
    start: 'COMEÇAR',
  },
  ar: {
    title: 'الجذور والأوزان',
    direction: 'اتجاه الترجمة',
    forward: 'من العبرية إلى العربية',
    reverse: 'من العربية إلى العبرية',
    count: 'عدد التمارين',
    families: 'اختر عائلة من الأفعال ذات الجذر نفسه',
    sizes: { 2: 'فعلان', 3: '3 أفعال', 4: '4 أفعال' },
    all: 'الكل',
    availableFamilies: 'العائلات المتاحة',
    availableVerbs: 'الأفعال المتاحة للتمارين',
    repeat: 'ستتكرر بعض الأفعال لأن عدد التمارين أكبر من عدد الأفعال المتاحة.',
    empty: 'لا توجد تمارين متاحة للإعدادات المحددة.',
    tipTitle: 'جذر واحد — أوزان مختلفة — أفعال مختلفة.',
    tip: 'قارن الأفعال، ولاحظ الفروق في المعاني، وتعلّم اختيار الكلمة المناسبة عند التحدّث.',
    start: 'ابدأ',
  },
  am: {
    title: 'ሥሮች እና ቢንያኖች',
    direction: 'የትርጉም አቅጣጫ',
    forward: 'ከዕብራይስጥ ወደ አማርኛ',
    reverse: 'ከአማርኛ ወደ ዕብራይስጥ',
    count: 'የልምምድ ብዛት',
    families: 'ተመሳሳይ ሥር ያላቸውን ግሶች ቤተሰብ ይምረጡ',
    sizes: { 2: '2 ግሶች', 3: '3 ግሶች', 4: '4 ግሶች' },
    all: 'ሁሉም',
    availableFamilies: 'ያሉ ቤተሰቦች',
    availableVerbs: 'ለልምምድ ያሉ ግሶች',
    repeat: 'የልምምዶቹ ብዛት ካሉት ግሶች በላይ ስለሆነ አንዳንድ ግሶች ይደገማሉ።',
    empty: 'ለተመረጡት ቅንብሮች ልምምዶች የሉም።',
    tipTitle: 'አንድ ሥር — የተለያዩ ቢንያኖች — የተለያዩ ድርጊቶች።',
    tip: 'ግሶችን ያነጻጽሩ፣ የትርጉም ልዩነቶችን ያስተውሉ፣ ሲናገሩም ትክክለኛውን ቃል መምረጥ ይማሩ።',
    start: 'ጀምር',
  },
};

const FAMILY_SIZES = [2, 3, 4];
const DEFAULT_COUNTS = [8, 12, 18, 24];
const EMPTY = [];

const normalizeDirection = value =>
  value === 'translationToHe'
    ? 'translationToHe'
    : 'heToTranslation';

export const buildRootFamilies = (items = [], language = 'en') => {
  const lang = normalizeRootLanguage(language);
  const groups = new Map();

  if (!Array.isArray(items)) return [];

  items.forEach(item => {
    if (!item || item.id == null) return;

    const familyId = String(item.id).trim();
    if (!familyId) return;

    if (!groups.has(familyId)) groups.set(familyId, []);
    groups.get(familyId).push(item);
  });

  const families = [];

  groups.forEach((rows, id) => {
    const unique = new Map();
    let invalid = false;

    rows.forEach(item => {
      const key = getRootVerbKey(item);
      const translation = String(item[lang] ?? '').trim();
      const root = String(item.root ?? '').trim();
      const transliteration = String(item.transliteration ?? '').trim();

      if (!key || !root || !transliteration || !translation) {
        invalid = true;
        return;
      }

      if (unique.has(key)) {
        invalid = true;
        return;
      }

      unique.set(key, {
        ...item,
        id,
        key,
        root,
        verb: String(item.verb).trim(),
        bin: String(item.bin).trim(),
        transliteration,
        translation,
      });
    });

    const verbs = [...unique.values()];
    const roots = new Set(verbs.map(verb => verb.root));
    const bins = new Set(verbs.map(verb => verb.bin));
    const translations = new Set(
      verbs.map(verb =>
        verb.translation.toLowerCase().replace(/\s+/g, ' ')
      )
    );

    if (
      invalid ||
      !FAMILY_SIZES.includes(verbs.length) ||
      roots.size !== 1 ||
      bins.size !== verbs.length ||
      translations.size !== verbs.length
    ) return;

    families.push({
      id,
      root: verbs[0].root,
      size: verbs.length,
      verbs,
    });
  });

  return families;
};

const RootVerbListModal = ({
  language = 'en',
  items = EMPTY,
  excludedIds = EMPTY,
  selectedCount = 12,
  selectedSizes = FAMILY_SIZES,
  selectedDirection = 'heToTranslation',
  allowedCounts = DEFAULT_COUNTS,
  onSelectCount,
  onSelectSizes,
  onSelectDirection,
  onStart,
}) => {
  const lang = normalizeRootLanguage(language);
  const text = TEXTS[lang];
  const isRtl = lang === 'ar';
  const direction = normalizeDirection(selectedDirection);

  const counts = [...new Set(
    (Array.isArray(allowedCounts) ? allowedCounts : DEFAULT_COUNTS)
      .map(Number)
      .filter(value => Number.isInteger(value) && value > 0)
  )];

  const safeCount = counts.includes(Number(selectedCount))
    ? Number(selectedCount)
    : counts[0];

  const sizeSet = new Set(
    (Array.isArray(selectedSizes) ? selectedSizes : FAMILY_SIZES)
      .map(Number)
      .filter(size => FAMILY_SIZES.includes(size))
  );

  const allSelected = FAMILY_SIZES.every(size => sizeSet.has(size));

  const families = useMemo(
    () => buildRootFamilies(items, lang),
    [items, lang]
  );

  const availableFamilies = useMemo(() => {
    const excluded = new Set(
      (Array.isArray(excludedIds) ? excludedIds : []).map(String)
    );

    return families
      .map(family => ({
        ...family,
        taskVerbs: family.verbs.filter(
          verb => !excluded.has(verb.key)
        ),
      }))
      .filter(family => family.taskVerbs.length > 0);
  }, [families, excludedIds]);

  const selectedFamilies = availableFamilies.filter(
    family => sizeSet.has(family.size)
  );

  const verbCount = selectedFamilies.reduce(
    (total, family) => total + family.taskVerbs.length,
    0
  );

  const canStart =
    verbCount > 0 &&
    Number.isInteger(safeCount) &&
    typeof onStart === 'function';

  const familyOptions = [
    ...FAMILY_SIZES.map(size => ({
      value: size,
      label: text.sizes[size],
      count: availableFamilies.filter(
        family => family.size === size
      ).length,
      selected: sizeSet.has(size),
    })),
    {
      value: 'all',
      label: text.all,
      count: availableFamilies.length,
      selected: allSelected,
    },
  ];

  const toggleSize = size => {
    if (size === 'all') {
      onSelectSizes?.([...FAMILY_SIZES]);
      return;
    }

    const next = new Set(sizeSet);

    if (next.has(size)) {
      next.delete(size);
    } else {
      next.add(size);
    }

    onSelectSizes?.(
      FAMILY_SIZES.filter(value => next.has(value))
    );
  };

  const start = () => {
    if (!canStart) return;

    onStart({
      count: safeCount,
      sizes: FAMILY_SIZES.filter(size => sizeSet.has(size)),
      direction,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.15}>
          {text.title}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsCard}>
          <Text
            style={[styles.sectionTitle, isRtl && styles.rtlText]}
            maxFontSizeMultiplier={1.15}
          >
            {text.direction}
          </Text>

          <View style={styles.directionsWrap}>
            {[
              { value: 'heToTranslation', label: text.forward },
              { value: 'translationToHe', label: text.reverse },
            ].map(option => {
              const selected = direction === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelectDirection?.(option.value)}
                  style={({ pressed }) => [
                    styles.directionButton,
                    selected && styles.optionSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionButtonText,
                      selected && styles.selectedText,
                      { writingDirection: isRtl ? 'rtl' : 'ltr' },
                    ]}
                    maxFontSizeMultiplier={1.15}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.settingsDivider} />

          <Text
            style={[styles.sectionTitle, isRtl && styles.rtlText]}
            maxFontSizeMultiplier={1.15}
          >
            {text.count}
          </Text>

          <View style={styles.countsWrap}>
            {counts.map(count => {
              const selected = safeCount === count;

              return (
                <Pressable
                  key={count}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelectCount?.(count)}
                  style={({ pressed }) => [
                    styles.countButton,
                    selected && styles.optionSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.countButtonText,
                      selected && styles.selectedText,
                    ]}
                    maxFontSizeMultiplier={1.15}
                  >
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.settingsDivider} />

          <Text
            style={[styles.sectionTitle, isRtl && styles.rtlText]}
            maxFontSizeMultiplier={1.15}
          >
            {text.families}
          </Text>

          <View style={styles.familiesWrap}>
            {familyOptions.map(option => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: option.selected }}
                onPress={() => toggleSize(option.value)}
                style={({ pressed }) => [
                  styles.familyButton,
                  option.selected && styles.optionSelected,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.familyButtonText,
                    option.selected && styles.selectedText,
                    isRtl && styles.rtlText,
                  ]}
                  maxFontSizeMultiplier={1.15}
                >
                  {option.label}
                </Text>

                <View style={[
                  styles.familyCountBadge,
                  option.selected && styles.familyCountBadgeSelected,
                ]}>
                  <Text
                    style={[
                      styles.familyCountText,
                      option.selected && styles.selectedText,
                    ]}
                    maxFontSizeMultiplier={1.1}
                  >
                    {option.count}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.settingsDivider} />

          <View style={[
            styles.summaryRow,
            isRtl && styles.rowRtl,
          ]}>
            <Text
              style={[styles.summaryLabel, isRtl && styles.rtlText]}
              maxFontSizeMultiplier={1.15}
            >
              {text.availableFamilies}
            </Text>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryValue}>
                {selectedFamilies.length}
              </Text>
            </View>
          </View>

          <View style={[
            styles.summaryRow,
            styles.summaryLastRow,
            isRtl && styles.rowRtl,
          ]}>
            <Text
              style={[styles.summaryLabel, isRtl && styles.rtlText]}
              maxFontSizeMultiplier={1.15}
            >
              {text.availableVerbs}
            </Text>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryValue}>
                {verbCount}
              </Text>
            </View>
          </View>

          {verbCount > 0 && safeCount > verbCount && (
            <Text
              style={[styles.noticeText, isRtl && styles.rtlText]}
              maxFontSizeMultiplier={1.15}
            >
              {text.repeat}
            </Text>
          )}

          {verbCount === 0 && (
            <Text
              style={[styles.emptyText, isRtl && styles.rtlText]}
              maxFontSizeMultiplier={1.15}
            >
              {text.empty}
            </Text>
          )}
        </View>

        <View style={styles.tipCard}>
          <Text
            style={[styles.tipTitle, isRtl && styles.rtlText]}
            maxFontSizeMultiplier={1.15}
          >
            {text.tipTitle}
          </Text>

          <Text
            style={[styles.tipText, isRtl && styles.rtlText]}
            maxFontSizeMultiplier={1.15}
          >
            {text.tip}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStart }}
          disabled={!canStart}
          onPress={start}
          style={({ pressed }) => [
            styles.startButton,
            !canStart && styles.startButtonDisabled,
            pressed && styles.startButtonPressed,
          ]}
        >
          <Text
            style={styles.startButtonText}
            maxFontSizeMultiplier={1.15}
          >
            {text.start}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  title: {
    marginTop: 18,
    marginBottom: 18,
    color: COLORS.card,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 5,
  },
  directionsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  directionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: COLORS.optionBorder,
    borderRadius: 14,
    backgroundColor: COLORS.option,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionButtonText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  settingsDivider: {
    height: 1,
    marginVertical: 10,
    backgroundColor: COLORS.divider,
  },
  countsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countButton: {
    flexGrow: 1,
    flexBasis: 40,
    minHeight: 44,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: COLORS.optionBorder,
    borderRadius: 14,
    backgroundColor: COLORS.option,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  familiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyButton: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.optionBorder,
    borderRadius: 14,
    backgroundColor: COLORS.option,
  },
  familyButtonText: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  familyCountBadge: {
    minWidth: 27,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: 'rgba(131,163,205,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyCountBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  familyCountText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
  },
  optionSelected: {
    borderColor: COLORS.selected,
    backgroundColor: COLORS.selected,
  },
  selectedText: {
    color: COLORS.selectedText,
  },
  buttonPressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.88,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryLastRow: {
    marginTop: 6,
  },
  summaryLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
  },
  summaryBadge: {
    minWidth: 38,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: COLORS.card,
    fontSize: 11,
    lineHeight: 19,
    fontWeight: '900',
  },
  noticeText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.selected,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  tipCard: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,253,239,0.45)',
    backgroundColor: 'rgba(255,253,239,0.9)',
  },
  tipTitle: {
    color: COLORS.selected,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  tipText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  startButton: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 26,
    backgroundColor: COLORS.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

export default memo(RootVerbListModal);