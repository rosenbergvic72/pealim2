// StatsReportModalMulti.js
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import FadeInView from './api/FadeInView';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const { height: SCREEN_SCREEN_HEIGHT, width: SCREEN_SCREEN_WIDTH } = Dimensions.get('screen');

// базовый лог по размерам окна
console.log(
  '[StatsModal] Dimensions:',
  'window =', SCREEN_WIDTH, SCREEN_HEIGHT,
  'screen =', SCREEN_SCREEN_WIDTH, SCREEN_SCREEN_HEIGHT
);

/**
 * Обёртка над Text: если язык ar — увеличиваем fontSize на +2
 * Остальной стиль не трогаем.
 */
const LangText = ({ lang, style, children, ...rest }) => {
  const flat = StyleSheet.flatten(style) || {};
  const baseFontSize = flat.fontSize || 14;
  const fontSize = lang === 'ar' ? baseFontSize + 1 : baseFontSize;

  return (
    <Text
      {...rest}
      style={[style, { fontSize }]}
      maxFontSizeMultiplier={1.2}
    >
      {children}
    </Text>
  );
};

/* ===== ПЕРИОДЫ ===== */
const PERIODS = [
  { id: '1d',  days: 1  },
  { id: '2d',  days: 2  },
  { id: '3d',  days: 3  },
  { id: '5d',  days: 5  },
  { id: '7d',  days: 7  },
  { id: '14d', days: 14 },
  { id: '30d', days: 30 },
  { id: '60d', days: 60 },
];
const TOP_PERIODS = PERIODS.slice(0, 4);
const BOTTOM_PERIODS = PERIODS.slice(4);

/* ===== СУФФИКСЫ ДЛЯ id упражнений по языкам ===== */
const EX_SUFFIX = {
  ru: '',
  en: 'En',
  fr: 'Fr',
  es: 'Es',
  pt: 'Pt',
  am: 'Am',
  ar: 'Ar',
  he: 'He', // на будущее
};

/* Базовые упражнения — общий порядок */
const BASE_EXERCISES = [
  {
    baseId: 'exercise1',
    index: 1,
    useLanguageSuffix: true,
  },
  {
    baseId: 'exercise2',
    index: 2,
    useLanguageSuffix: true,
  },
  {
    baseId: 'prepositionPronouns',
    index: 3,
    useLanguageSuffix: false,
  },
  // {
  //   baseId: 'prepositionAfterVerbs',
  //   index: 4,
  //   useLanguageSuffix: false,
  // },
  {
    baseId: 'exercise3',
    index: 5,
    useLanguageSuffix: true,
  },
  {
    baseId: 'exercise5',
    index: 6,
    useLanguageSuffix: true,
  },
  {
    baseId: 'exercise6',
    index: 7,
    useLanguageSuffix: true,
  },
  {
    baseId: 'exercise8',
    index: 8,
    useLanguageSuffix: true,
  },
   {
    baseId: 'prepositionAfterVerbs',
    index: 4,
    useLanguageSuffix: false,
  },
  {
    baseId: 'exercise4',
    index: 9,
    useLanguageSuffix: true,
  },
  {
    baseId: 'exercise7',
    index: 10,
    useLanguageSuffix: true,
  },
];

/* ===== ЛОКАЛИ ДЛЯ ДАТ ===== */
const LOCALE_BY_LANG = {
  ru: 'ru-RU',
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
  am: 'am-ET',
  ar: 'ar-EG',
  he: 'he-IL',
};

/* ===== СТРОКИ ДЛЯ ВСЕХ ЯЗЫКОВ ===== */
const STRINGS = {
  ru: {
    title: 'Статистика прогресса',
    reportGenerated: 'Отчёт сформирован:',
    summaryTitle: 'Итоги за выбранный период',
    perExerciseTitle: 'Статистика по упражнениям за период',
    loading: 'Загрузка…',
    exercisesCompleted: 'Выполнено упражнений',
    activeDays: 'Активных дней',
    averageScore: 'Средний результат',
    perExCompletedLabel: 'Выполнено:',
    perExAverageLabel: 'Средний результат:',
    shareButton: 'Поделиться отчётом',
    closeButton: 'Закрыть',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `Прогресс ${user || ''} за ${label}`,
    shareMessage: (user, label, timeString) =>
      `Прогресс ${user || 'пользователя'} за ${label} (отчёт от ${timeString})`,
    periods: {
      '1d':  '1 день',
      '2d':  '2 дня',
      '3d':  '3 дня',
      '5d':  '5 дней',
      '7d':  '1 неделя',
      '14d': '2 недели',
      '30d': '1 месяц',
      '60d': '2 месяца',
    },
exercises: {
  exercise1: 'Упражнение 1',
  exercise2: 'Упражнение 2',

  prepositionPronouns: 'Предлоги 1',
  

  exercise3: 'Упражнение 3',
  exercise5: 'Упражнение 4',
  exercise6: 'Упражнение 5',
  exercise8: 'Упражнение 6',
  prepositionAfterVerbs: 'Предлоги 2',
  exercise4: 'Упражнение 7',
  exercise7: 'Упражнение 8',
},
  },

  en: {
    title: 'Progress statistics',
    reportGenerated: 'Report generated:',
    summaryTitle: 'Summary for the selected period',
    perExerciseTitle: 'Per-exercise statistics for the period',
    loading: 'Loading…',
    exercisesCompleted: 'Exercises completed',
    activeDays: 'Active days',
    averageScore: 'Average score',
    perExCompletedLabel: 'Completed:',
    perExAverageLabel: 'Average score:',
    shareButton: 'Share report',
    closeButton: 'Close',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `Progress of ${user || ''} for ${label}`,
    shareMessage: (user, label, timeString) =>
      `Progress of ${user || 'the user'} for ${label} (report generated at ${timeString})`,
    periods: {
      '1d':  '1 day',
      '2d':  '2 days',
      '3d':  '3 days',
      '5d':  '5 days',
      '7d':  '1 week',
      '14d': '2 weeks',
      '30d': '1 month',
      '60d': '2 months',
    },
    exercises: {
  exercise1: 'Exercise 1',
  exercise2: 'Exercise 2',

   prepositionPronouns: 'Prepositions 1',
prepositionAfterVerbs: 'Prepositions 2',

  exercise3: 'Exercise 3',
  exercise5: 'Exercise 4',
  exercise6: 'Exercise 5',
  exercise8: 'Exercise 6',
  exercise4: 'Exercise 7',
  exercise7: 'Exercise 8',
},
  },

  fr: {
    title: 'Statistiques de progression',
    reportGenerated: 'Rapport généré :',
    summaryTitle: 'Résumé pour la période sélectionnée',
    perExerciseTitle: 'Statistiques par exercice pour la période',
    loading: 'Chargement…',
    exercisesCompleted: 'Exercices terminés',
    activeDays: 'Jours actifs',
    averageScore: 'Score moyen',
    perExCompletedLabel: 'Terminé :',
    perExAverageLabel: 'Score moyen :',
    shareButton: 'Partager le rapport',
    closeButton: 'Fermer',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `Progression de ${user || ''} pour ${label}`,
    shareMessage: (user, label, timeString) =>
      `Progression de ${user || "l'utilisateur"} pour ${label} (rapport généré le ${timeString})`,
    periods: {
      '1d':  '1 jour',
      '2d':  '2 jours',
      '3d':  '3 jours',
      '5d':  '5 jours',
      '7d':  '1 semaine',
      '14d': '2 semaines',
      '30d': '1 mois',
      '60d': '2 mois',
    },
exercises: {
  exercise1: 'Exercice 1',
  exercise2: 'Exercice 2',

  prepositionPronouns: 'Prépositions 1',
prepositionAfterVerbs: 'Prépositions 2',
  exercise3: 'Exercice 3',
  exercise5: 'Exercice 4',
  exercise6: 'Exercice 5',
  exercise8: 'Exercice 6',
  exercise4: 'Exercice 7',
  exercise7: 'Exercice 8',
},
  },

  es: {
    title: 'Estadísticas de progreso',
    reportGenerated: 'Informe generado:',
    summaryTitle: 'Resumen del período seleccionado',
    perExerciseTitle: 'Estadísticas por ejercicio para el período',
    loading: 'Cargando…',
    exercisesCompleted: 'Ejercicios completados',
    activeDays: 'Días activos',
    averageScore: 'Resultado promedio',
    perExCompletedLabel: 'Completado:',
    perExAverageLabel: 'Resultado promedio:',
    shareButton: 'Compartir informe',
    closeButton: 'Cerrar',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `Progreso de ${user || ''} durante ${label}`,
    shareMessage: (user, label, timeString) =>
      `Progreso de ${user || 'el usuario'} durante ${label} (informe generado el ${timeString})`,
    periods: {
      '1d':  '1 día',
      '2d':  '2 días',
      '3d':  '3 días',
      '5d':  '5 días',
      '7d':  '1 semana',
      '14d': '2 semanas',
      '30d': '1 mes',
      '60d': '2 meses',
    },
exercises: {
  exercise1: 'Ejercicio 1',
  exercise2: 'Ejercicio 2',

  prepositionPronouns: 'Preposiciones 1',
prepositionAfterVerbs: 'Preposiciones 2',
  exercise3: 'Ejercicio 3',
  exercise5: 'Ejercicio 4',
  exercise6: 'Ejercicio 5',
  exercise8: 'Ejercicio 6',
  exercise4: 'Ejercicio 7',
  exercise7: 'Ejercicio 8',
},
  },

  pt: {
    title: 'Estatísticas de progresso',
    reportGenerated: 'Relatório gerado:',
    summaryTitle: 'Resumo do período selecionado',
    perExerciseTitle: 'Estatísticas por exercício no período',
    loading: 'Carregando…',
    exercisesCompleted: 'Exercícios concluídos',
    activeDays: 'Dias ativos',
    averageScore: 'Pontuação média',
    perExCompletedLabel: 'Concluído:',
    perExAverageLabel: 'Pontuação média:',
    shareButton: 'Compartilhar relatório',
    closeButton: 'Fechar',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `Progresso de ${user || ''} em ${label}`,
    shareMessage: (user, label, timeString) =>
      `Progresso de ${user || 'o usuário'} em ${label} (relatório gerado em ${timeString})`,
    periods: {
      '1d':  '1 dia',
      '2d':  '2 dias',
      '3d':  '3 dias',
      '5d':  '5 dias',
      '7d':  '1 semana',
      '14d': '2 semanas',
      '30d': '1 mês',
      '60d': '2 meses',
    },
exercises: {
  exercise1: 'Exercício 1',
  exercise2: 'Exercício 2',

  prepositionPronouns: 'Preposições 1',
prepositionAfterVerbs: 'Preposições 2',
  exercise3: 'Exercício 3',
  exercise5: 'Exercício 4',
  exercise6: 'Exercício 5',
  exercise8: 'Exercício 6',
  exercise4: 'Exercício 7',
  exercise7: 'Exercício 8',
},
  },

  am: {
    title: 'የእድገት ሪፖርት',
    reportGenerated: 'ሪፖርቱ የተሰራበት ጊዜ:',
    summaryTitle: 'በተመረጠው ጊዜ ውስጥ የተደረገ ማጠቃለያ',
    perExerciseTitle: 'በተግባር የተመዘነ ሪፖርት ለዚህ ጊዜ',
    loading: 'በመጫን ላይ…',
    exercisesCompleted: 'የተጨረሱ ልምምዶች',
    activeDays: 'ንቁ ቀናት',
    averageScore: 'አማካኝ ውጤት',
    perExCompletedLabel: 'ተከናውኗል:',
    perExAverageLabel: 'አማካኝ ውጤት:',
    shareButton: 'ሪፖርቱን አጋራ',
    closeButton: 'ዝጋ',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `የ${user || ''} እድገት ለ ${label}`,
    shareMessage: (user, label, timeString) =>
      `የ${user || 'ተጠቃሚው'} እድገት ለ ${label} (ሪፖርቱ የተሰራበት ጊዜ: ${timeString})`,
    periods: {
      '1d':  '1 ቀን',
      '2d':  '2 ቀናት',
      '3d':  '3 ቀናት',
      '5d':  '5 ቀናት',
      '7d':  '1 ሳምንት',
      '14d': '2 ሳምንታት',
      '30d': '1 ወር',
      '60d': '2 ወራት',
    },
 exercises: {
  exercise1: 'ልምምድ 1',
  exercise2: 'ልምምድ 2',

  prepositionPronouns: 'መስተዋድዶች 1',
prepositionAfterVerbs: 'መስተዋድዶች 2',
  exercise3: 'ልምምድ 3',
  exercise5: 'ልምምድ 4',
  exercise6: 'ልምምድ 5',
  exercise8: 'ልምምድ 6',
  exercise4: 'ልምምድ 7',
  exercise7: 'ልምምድ 8',
},
  },

  ar: {
    title: 'تقرير التقدّم',
    reportGenerated: 'وقت إنشاء التقرير:',
    summaryTitle: 'ملخّص للفترة المحدّدة',
    perExerciseTitle: 'إحصاءات حسب التمرين لهذه الفترة',
    loading: 'جارٍ التحميل…',
    exercisesCompleted: 'التمارين المنجزة',
    activeDays: 'الأيام النشطة',
    averageScore: 'المعدّل المتوسّط',
    perExCompletedLabel: 'تم التنفيذ:',
    perExAverageLabel: 'متوسّط النتيجة:',
    shareButton: 'مشاركة التقرير',
    closeButton: 'إغلاق',
    userPlaceholder: '—',
    shareDialogTitle: (user, label) =>
      `تقدّم ${user || ''} لفترة ${label}`,
    shareMessage: (user, label, timeString) =>
      `تقدّم ${user || 'المستخدم'} لفترة ${label} (وقت إنشاء التقرير: ${timeString})`,
    periods: {
      '1d':  'يوم واحد',
      '2d':  'يومان',
      '3d':  '3 أيام',
      '5d':  '5 أيام',
      '7d':  'أسبوع واحد',
      '14d': 'أسبوعان',
      '30d': 'شهر واحد',
      '60d': 'شهران',
    },
exercises: {
  exercise1: 'التمرين 1',
  exercise2: 'التمرين 2',

  prepositionPronouns: 'حروف الجر 1',
prepositionAfterVerbs: 'حروف الجر 2',
  exercise3: 'التمرين 3',
  exercise5: 'التمرين 4',
  exercise6: 'التمرين 5',
  exercise8: 'التمرين 6',
  exercise4: 'التمرين 7',
  exercise7: 'التمرين 8',
},
  },
};

/* ===== ВСПОМОГАТЕЛЬНОЕ: список упражнений под язык ===== */
function buildExercisesForLang(language) {
  const lang =
    STRINGS[language]
      ? language
      : 'ru';

  const suffix =
    EX_SUFFIX[lang] ?? '';

  const labels =
    STRINGS[lang].exercises;

  return BASE_EXERCISES.map(
    item => {
      const storageId =
        item.useLanguageSuffix
          ? `${item.baseId}${suffix}`
          : item.baseId;

      return {
        storageId,
        label:
          labels[item.baseId] ||
          `Exercise ${item.index}`,
      };
    }
  );
}

/* ==================== КОМПОНЕНТ ==================== */

const StatsReportModalMulti = ({ visible, onClose, language = 'ru' }) => {
  const lang = STRINGS[language] ? language : 'ru';
  const t = STRINGS[lang];
  const locale = LOCALE_BY_LANG[lang] || 'en-GB';
  const isRTL = lang === 'ar';

  const [selected, setSelected] = useState({
    ...PERIODS[0],
    label: t.periods['1d'],
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalExercises: 0,
    activeDays: 0,
    averageScore: 0,
  });
  const [generatedAt, setGeneratedAt] = useState(null);
  const [userName, setUserName] = useState('');
  const [perExerciseStats, setPerExerciseStats] = useState({});

  // логи размеров
  const [shotLayout, setShotLayout] = useState(null);
  const [containerLayout, setContainerLayout] = useState(null);
  const [scrollLayout, setScrollLayout] = useState(null);
  const [scrollContentSize, setScrollContentSize] = useState(null);

  const viewShotRef = useRef(null);
  const exercises = useMemo(() => buildExercisesForLang(lang), [lang]);

  useEffect(() => {
    console.log('[StatsModal] visible =', visible, 'lang =', lang);
  }, [visible, lang]);

  useEffect(() => {
    console.log(
      '[StatsModal] selected period =',
      selected.id,
      'days =', selected.days,
      'label =', selected.label
    );
  }, [selected.id, selected.days, selected.label]);

  // Обновляем подпись периода при смене языка
  useEffect(() => {
    const current = PERIODS.find((p) => p.id === selected.id) || PERIODS[0];
    setSelected({
      ...current,
      label: t.periods[current.id],
    });
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Загружаем имя
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const storedName = await AsyncStorage.getItem('name');
        if (storedName) setUserName(storedName);
      } catch (e) {
        console.log('Error loading username', e);
      }
    })();
  }, [visible]);

  // Загружаем статистику при открытии / смене периода
  useEffect(() => {
    if (!visible) return;
    loadPeriodStats(selected.days);
  }, [visible, selected.days]);

  const loadPeriodStats = async (daysCount) => {
    setLoading(true);
    console.log('[StatsModal] loadPeriodStats days =', daysCount);
    try {
      const now = new Date();
      let totalExercises = 0;
      let totalScore = 0;
      const daysSet = new Set();
      const perExerciseAgg = {};

      for (let i = 0; i < daysCount; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const iso = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `daily_stats_${iso}`;
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const count = parsed.exercisesCompleted || 0;
        const scoreSum = parsed.totalScore || 0;

        if (count > 0) {
          totalExercises += count;
          totalScore += scoreSum;
          daysSet.add(parsed.date || iso);
        }

        const per = parsed.perExercise || {};
        Object.entries(per).forEach(([exerciseId, exData]) => {
          const exTimes = exData.timesCompleted || 0;
          const exSum   = exData.totalScore || 0;

          if (!perExerciseAgg[exerciseId]) {
            perExerciseAgg[exerciseId] = {
              timesCompleted: 0,
              totalScore: 0,
            };
          }
          perExerciseAgg[exerciseId].timesCompleted += exTimes;
          perExerciseAgg[exerciseId].totalScore     += exSum;
        });
      }

      const perExerciseResult = {};
      Object.entries(perExerciseAgg).forEach(([exerciseId, data]) => {
        const times = data.timesCompleted || 0;
        const sum   = data.totalScore || 0;
        const avg   = times > 0 ? sum / times : 0;
        perExerciseResult[exerciseId] = {
          timesCompleted: times,
          averageCompletionRate: avg,
        };
      });

      setStats({
        totalExercises,
        activeDays: daysSet.size,
        averageScore:
          totalExercises > 0 ? (totalScore / totalExercises).toFixed(1) : 0,
      });

      setPerExerciseStats(perExerciseResult);
      setGeneratedAt(new Date());

      console.log(
        '[StatsModal] stats loaded:',
        'totalExercises =', totalExercises,
        'activeDays =', daysSet.size,
        'avgScore =', totalExercises > 0 ? (totalScore / totalExercises).toFixed(1) : 0
      );
    } catch (e) {
      console.log('Error loading period stats', e);
      setStats({ totalExercises: 0, activeDays: 0, averageScore: 0 });
      setPerExerciseStats({});
      setGeneratedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  const handleShareImage = async () => {
    try {
      if (!viewShotRef.current) return;
      const uri = await viewShotRef.current.capture();
      const available = await Sharing.isAvailableAsync();

      const timeString = generatedAt ? generatedAt.toLocaleString(locale) : '—';
      const user = userName || t.userPlaceholder;
      const label = selected.label || '';

      console.log(
        '[StatsModal] share image',
        'uri =', uri,
        'available =', available,
        'timeString =', timeString
      );

      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t.shareDialogTitle(user, label),
        });
        return;
      }

      await Share.share({
        title: t.shareDialogTitle(user, label),
        message: t.shareMessage(user, label, timeString),
        url: uri,
      });
    } catch (e) {
      console.log('Share image error', e);
    }
  };

  const renderTimestamp = () => {
    if (!generatedAt) return null;
    return (
      <LangText lang={lang} style={styles.timestamp}>
        {t.reportGenerated}{' '}
        <LangText lang={lang} style={styles.timestamp}>
          {generatedAt.toLocaleString(locale)}
        </LangText>
      </LangText>
    );
  };

  const onSelectPeriod = (p) => {
    console.log('[StatsModal] onSelectPeriod', p.id, p.days);
    setSelected({
      ...p,
      label: t.periods[p.id],
    });
  };

  // обработчики layout-ов
  const handleShotLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setShotLayout({ width, height });
    console.log('[StatsModal] shotWrapper layout =', width, height);
  };

  const handleContainerLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerLayout({ width, height });
    console.log('[StatsModal] container layout =', width, height);
  };

  const handleScrollLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setScrollLayout({ width, height });
    console.log('[StatsModal] scroll layout =', width, height);
  };

  const handleScrollContentSize = (w, h) => {
    setScrollContentSize({ width: w, height: h });
    console.log('[StatsModal] scroll contentSize =', w, h);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <FadeInView style={styles.overlay}>
        <View
          style={styles.shotWrapper}
          onLayout={handleShotLayout}
        >
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 0.9 }}
            style={styles.container}
            onLayout={handleContainerLayout}
          >
            <LangText lang={lang} style={styles.title}>
              {t.title}
            </LangText>

            <LangText lang={lang} style={styles.userName}>
              <LangText lang={lang} style={styles.userNameStrong}>
                {userName || t.userPlaceholder}
              </LangText>
            </LangText>

            {/* Кнопки периодов */}
            <View style={styles.periodBlock}>
              <View style={styles.periodRowTop}>
                {TOP_PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.periodButton,
                      selected.id === p.id && styles.periodButtonActive,
                    ]}
                    onPress={() => onSelectPeriod(p)}
                  >
                    <LangText
                      lang={lang}
                      style={[
                        styles.periodButtonText,
                        selected.id === p.id && styles.periodButtonTextActive,
                      ]}
                    >
                      {t.periods[p.id]}
                    </LangText>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.periodRowBottom}>
                {BOTTOM_PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.periodButton,
                      selected.id === p.id && styles.periodButtonActive,
                    ]}
                    onPress={() => onSelectPeriod(p)}
                  >
                    <LangText
                      lang={lang}
                      style={[
                        styles.periodButtonText,
                        selected.id === p.id && styles.periodButtonTextActive,
                      ]}
                    >
                      {t.periods[p.id]}
                    </LangText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderTimestamp()}

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              onLayout={handleScrollLayout}
              onContentSizeChange={handleScrollContentSize}
            >
              {loading ? (
                <LangText lang={lang} style={styles.loadingText}>
                  {t.loading}
                </LangText>
              ) : (
                <>
                  <LangText
                    lang={lang}
                    style={[
                      styles.sectionTitle,
                      isRTL && styles.sectionTitleRtl,
                    ]}
                  >
                    {t.summaryTitle}
                  </LangText>

                  <View
                    style={[
                      styles.row,
                      isRTL && styles.rowRtl,
                    ]}
                  >
                    <LangText
                      lang={lang}
                      style={[
                        styles.label,
                        isRTL && styles.labelRtl,
                      ]}
                    >
                      {t.exercisesCompleted}
                    </LangText>
                    <LangText lang={lang} style={styles.value}>
                      {stats.totalExercises}
                    </LangText>
                  </View>

                  <View
                    style={[
                      styles.row,
                      isRTL && styles.rowRtl,
                    ]}
                  >
                    <LangText
                      lang={lang}
                      style={[
                        styles.label,
                        isRTL && styles.labelRtl,
                      ]}
                    >
                      {t.activeDays}
                    </LangText>
                    <LangText lang={lang} style={styles.value}>
                      {stats.activeDays}
                    </LangText>
                  </View>

                  <View
                    style={[
                      styles.row,
                      isRTL && styles.rowRtl,
                    ]}
                  >
                    <LangText
                      lang={lang}
                      style={[
                        styles.label,
                        isRTL && styles.labelRtl,
                      ]}
                    >
                      {t.averageScore}
                    </LangText>
                    <LangText lang={lang} style={styles.value}>
                      {stats.averageScore}%
                    </LangText>
                  </View>

                  <LangText
                    lang={lang}
                    style={[
                      styles.sectionTitle,
                      { marginTop: 12 },
                      isRTL && styles.sectionTitleRtl,
                    ]}
                  >
                    {t.perExerciseTitle}
                  </LangText>

                  {exercises.map((ex) => {
                    const s = perExerciseStats[ex.storageId];
                    const times = s?.timesCompleted ?? 0;
                    const avg =
                      s && typeof s.averageCompletionRate === 'number'
                        ? s.averageCompletionRate.toFixed(1)
                        : 0;

                    return (
                      <View key={ex.storageId} style={styles.exerciseRow}>
                        <LangText
                          lang={lang}
                          style={[
                            styles.exerciseLabel,
                            isRTL && styles.exerciseLabelRtl,
                          ]}
                        >
                          {ex.label}
                        </LangText>
                        <LangText
                          lang={lang}
                          style={[
                            styles.exerciseSub,
                            isRTL && styles.exerciseSubRtl,
                          ]}
                        >
                          {t.perExCompletedLabel}{' '}
                          <LangText lang={lang} style={styles.bold}>
                            {times}
                          </LangText>{' '}
                          | {t.perExAverageLabel}{' '}
                          <LangText lang={lang} style={styles.bold}>
                            {avg}%
                          </LangText>
                        </LangText>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareImage}
              >
                <LangText lang={lang} style={styles.shareText}>
                  {t.shareButton}
                </LangText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <LangText lang={lang} style={styles.closeText}>
                  {t.closeButton}
                </LangText>
              </TouchableOpacity>
            </View>
          </ViewShot>
        </View>
      </FadeInView>
    </Modal>
  );
};

export default StatsReportModalMulti;

/* ==================== СТИЛИ ==================== */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // фикс рамки под ViewShot: размер от окна
  shotWrapper: {
    width: SCREEN_WIDTH * 0.96,
    height: SCREEN_HEIGHT * 0.86,
  },

  // карточка отчёта заполняет рамку
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2D4769',
  },

  title: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#C3D2EB',
    borderRadius: 8,
    color: '#003366',
    padding: 10,
  },
  userName: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  userNameStrong: {
    fontWeight: 'bold',
    color: '#bd462a',
  },

  periodBlock: {
    marginBottom: 8,
  },
  periodRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  periodRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    width: '23%',
    minWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D4769',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2D4769',
  },
  periodButtonText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#2D4769',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: 'white',
  },

  timestamp: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },

  scroll: {
    flex: 1,
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 4,
  },

  loadingText: {
    textAlign: 'center',
    color: '#2D4769',
    marginVertical: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#bd462a',
    marginBottom: 4,
  },
  sectionTitleRtl: {
    textAlign: 'right',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  label: {
    fontSize: 13,
    color: '#333',
  },
  labelRtl: {
    textAlign: 'right',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D4769',
  },

  exerciseRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D4769',
  },
  exerciseLabelRtl: {
    textAlign: 'right',
  },
  exerciseSub: {
    fontSize: 12,
    color: '#444',
    marginTop: 1,
  },
  exerciseSubRtl: {
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
    color: '#2D4769',
  },

  footer: {
    marginTop: 4,
  },
  shareButton: {
    backgroundColor: '#bd462a',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  shareText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D4769',
  },
  closeText: {
    textAlign: 'center',
    color: '#2D4769',
    fontWeight: '600',
    fontSize: 14,
  },
});
