import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const DEFAULT_COUNTS = [6, 12, 18, 24];
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
    title: 'Выберите количество заданий',
    subtitle: 'Сколько заданий выполнить в этом упражнении?',
    unit: 'заданий',
    start: 'НАЧАТЬ',
  },
  en: {
    title: 'Choose the number of tasks',
    subtitle: 'How many tasks would you like to complete?',
    unit: 'tasks',
    start: 'START',
  },
  fr: {
    title: 'Choisissez le nombre de tâches',
    subtitle: 'Combien de tâches souhaitez-vous faire ?',
    unit: 'tâches',
    start: 'COMMENCER',
  },
  es: {
    title: 'Elige el número de tareas',
    subtitle: '¿Cuántas tareas quieres completar?',
    unit: 'tareas',
    start: 'EMPEZAR',
  },
  pt: {
    title: 'Escolha o número de tarefas',
    subtitle: 'Quantas tarefas deseja realizar?',
    unit: 'tarefas',
    start: 'COMEÇAR',
  },
  ar: {
    title: 'اختر عدد المهام',
    subtitle: 'كم مهمة تريد أن تنجز في هذا التمرين؟',
    unit: 'مهام',
    start: 'ابدأ',
  },
  am: {
    title: 'የልምምድ ብዛት ይምረጡ',
    subtitle: 'በዚህ ልምምድ ስንት ጥያቄዎችን መስራት ይፈልጋሉ?',
    unit: 'ጥያቄዎች',
    start: 'ጀምር',
  },
};
const normalizeLanguage = value => {
  const key = String(value || 'ru').trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || 'ru';
};
export default function ExerciseCountStartScreen({
  visible = true,
  exerciseNumber,
  language = 'ru',
  defaultCount = 18,
  allowedCounts = DEFAULT_COUNTS,
  storageKey,
  onCountChange,
  onStart,
}) {
  const lang = normalizeLanguage(language);
  const text = UI[lang];
  const rtl = lang === 'ar';
  const counts = useMemo(() => {
    const clean = allowedCounts
      .map(Number)
      .filter(Number.isFinite)
      .filter((value, index, arr) => arr.indexOf(value) === index);
    return clean.length ? clean : DEFAULT_COUNTS;
  }, [allowedCounts]);
  const safeDefault = counts.includes(Number(defaultCount))
    ? Number(defaultCount)
    : counts[0];
  const [selectedCount, setSelectedCount] = useState(safeDefault);
  const resolvedStorageKey =
    storageKey ||
    (exerciseNumber ? `exercise${exerciseNumber}_selected_count` : null);
  useEffect(() => {
    setSelectedCount(safeDefault);
  }, [safeDefault, exerciseNumber]);
  useEffect(() => {
    if (!visible || !resolvedStorageKey) return;
    let active = true;
    AsyncStorage.getItem(resolvedStorageKey)
      .then(value => {
        if (!active) return;
        const saved = Number(value);
        if (counts.includes(saved)) {
          setSelectedCount(saved);
          onCountChange?.(saved);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [visible, resolvedStorageKey, counts, onCountChange]);
  const selectCount = count => {
    setSelectedCount(count);
    onCountChange?.(count);
  };
  const start = async () => {
    if (resolvedStorageKey) {
      try {
        await AsyncStorage.setItem(resolvedStorageKey, String(selectedCount));
      } catch {}
    }
    onStart?.(selectedCount);
  };
  if (!visible) return null;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text
            style={[styles.title, rtl && styles.rtlText]}
            maxFontSizeMultiplier={1.2}
          >
            {text.title}
          </Text>
          <Text
            style={[styles.subtitle, rtl && styles.rtlText]}
            maxFontSizeMultiplier={1.2}
          >
            {text.subtitle}
          </Text>
          <View style={[styles.countGrid, rtl && styles.rowReverse]}>
            {counts.map(count => {
              const selected = count === selectedCount;
              return (
                <TouchableOpacity
                  key={count}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  activeOpacity={0.82}
                  onPress={() => selectCount(count)}
                  style={[
                    styles.countButton,
                    selected && styles.countButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.countNumber,
                      selected && styles.countNumberSelected,
                    ]}
                    maxFontSizeMultiplier={1.2}
                  >
                    {count}
                  </Text>
                  <Text
                    style={[
                      styles.countUnit,
                      selected && styles.countUnitSelected,
                      rtl && styles.rtlText,
                    ]}
                    maxFontSizeMultiplier={1.2}
                  >
                    {text.unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={start}
            style={styles.startButton}
          >
            <Text
              style={[styles.startText, rtl && styles.rtlText]}
              maxFontSizeMultiplier={1.2}
            >
              {text.start}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#83A3CD',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#AFC1D0',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    color: '#2F4766',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#425A78',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  countButton: {
    width: '48%',
    minHeight: 76,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#D1E3F1',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonSelected: {
    backgroundColor: '#FFFDEF',
    borderColor: '#2F4766',
  },
  countNumber: {
    color: '#2F4766',
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
  },
  countNumberSelected: {
    color: '#CE6857',
  },
  countUnit: {
    marginTop: 2,
    color: '#586E8B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  countUnitSelected: {
    color: '#2F4766',
  },
  startButton: {
    minHeight: 54,
    marginTop: 5,
    borderRadius: 14,
    backgroundColor: '#1C3F60',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  startText: {
    color: '#FFFDEF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
