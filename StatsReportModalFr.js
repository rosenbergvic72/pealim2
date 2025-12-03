// StatsReportModalFr.js
import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// ПЕРИОДЫ: первые 4 → верхний ряд, следующие 4 → нижний
const PERIODS = [
  { id: '1d',  label: '1 jour',     days: 1 },
  { id: '2d',  label: '2 jours',    days: 2 },
  { id: '3d',  label: '3 jours',    days: 3 },
  { id: '5d',  label: '5 jours',    days: 5 },
  { id: '7d',  label: '1 semaine',  days: 7 },
  { id: '14d', label: '2 semaines', days: 14 },
  { id: '30d', label: '1 mois',     days: 30 },
  { id: '60d', label: '2 mois',     days: 60 },
];

const TOP_PERIODS = PERIODS.slice(0, 4);
const BOTTOM_PERIODS = PERIODS.slice(4);

// Список упражнений (французская ветка)
const EXERCISES = [
  { id: 'exercise1Fr', label: 'Exercice 1' },
  { id: 'exercise2Fr', label: 'Exercice 2' },
  { id: 'exercise3Fr', label: 'Exercice 3' },
  { id: 'exercise5Fr', label: 'Exercice 4' },
  { id: 'exercise6Fr', label: 'Exercice 5' },
  { id: 'exercise8Fr', label: 'Exercice 6' },
  { id: 'exercise4Fr', label: 'Exercice 7' },
  { id: 'exercise7Fr', label: 'Exercice 8' },
];

const StatsReportModalFr = ({ visible, onClose }) => {
  const [selected, setSelected] = useState(PERIODS[0]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalExercises: 0,
    activeDays: 0,
    averageScore: 0,
  });
  const [generatedAt, setGeneratedAt] = useState(null);
  const [userName, setUserName] = useState('');
  const [perExerciseStats, setPerExerciseStats] = useState({});

  const viewShotRef = useRef(null);

  // Загружаем имя пользователя при открытии модалки
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

  // Подгружаем общую и поупражнённую статистику при открытии / смене периода
  useEffect(() => {
    if (!visible) return;
    loadPeriodStats(selected.days);
    loadPerExerciseStats(selected.days);
  }, [visible, selected]);

  // Общая сводка за выбранный период (daily_stats_YYYY-MM-DD)
  const loadPeriodStats = async (daysCount) => {
    setLoading(true);
    try {
      const now = new Date();
      let totalExercises = 0;
      let totalScore = 0;
      const daysSet = new Set();

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
      }

      setStats({
        totalExercises,
        activeDays: daysSet.size,
        averageScore:
          totalExercises > 0 ? (totalScore / totalExercises).toFixed(1) : 0,
      });

      setGeneratedAt(new Date());
    } catch (e) {
      console.log('Error loading period stats', e);
      setStats({ totalExercises: 0, activeDays: 0, averageScore: 0 });
      setGeneratedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Поупражнённая статистика за период (daily_exercise_exId_YYYY-MM-DD)
  const loadPerExerciseStats = async (daysCount) => {
    const result = {};
    try {
      const now = new Date();

      for (const ex of EXERCISES) {
        let times = 0;
        let totalScore = 0;

        for (let i = 0; i < daysCount; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const iso = d.toISOString().split('T')[0]; // YYYY-MM-DD
          const key = `daily_exercise_${ex.id}_${iso}`;
          const raw = await AsyncStorage.getItem(key);
          if (!raw) continue;

          const parsed = JSON.parse(raw);
          times += parsed.timesCompleted || 0;
          totalScore += parsed.totalScore || 0;
        }

        const averageCompletionRate = times > 0 ? totalScore / times : 0;

        result[ex.id] = {
          timesCompleted: times,
          averageCompletionRate,
        };
      }

      setPerExerciseStats(result);
    } catch (e) {
      console.log('Error loading per-exercise stats', e);
      setPerExerciseStats({});
    }
  };

  const handleShareImage = async () => {
    try {
      if (!viewShotRef.current) return;

      // 1) Делаем «скриншот» отчёта
      const uri = await viewShotRef.current.capture();
      const available = await Sharing.isAvailableAsync();

      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Progression de ${userName || ''} pour ${selected.label}`,
        });
        return;
      }

      // Фолбэк — обычный Share с url
      const timeString = generatedAt
        ? generatedAt.toLocaleString('fr-FR')
        : '—';

      await Share.share({
        title: `Progression Verbify pour ${selected.label}`,
        message: `Progression de ${userName || 'l’utilisateur'} pour ${selected.label} (rapport généré le ${timeString})`,
        url: uri,
      });
    } catch (e) {
      console.log('Share image error', e);
    }
  };

  const renderTimestamp = () => {
    if (!generatedAt) return null;
    return (
      <Text style={styles.timestamp} maxFontSizeMultiplier={1.2}>
        Rapport généré :{' '}
        <Text style={styles.timestamp} maxFontSizeMultiplier={1.2}>
          {generatedAt.toLocaleString('fr-FR')}
        </Text>
      </Text>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.9 }}
          style={{ width: '90%', maxHeight: '90%' }}
        >
          <View style={styles.container}>
            <Text style={styles.title} maxFontSizeMultiplier={1.2}>
              Statistiques de progression
            </Text>

            {/* Nom de l’utilisateur */}
            <Text style={styles.userName} maxFontSizeMultiplier={1.2}>
              <Text
                style={styles.userNameStrong}
                maxFontSizeMultiplier={1.2}
              >
                {userName || '—'}
              </Text>
            </Text>

            {/* Boutons de période : 4 + 4 */}
            <View style={styles.periodBlock}>
              <View style={styles.periodRowTop}>
                {TOP_PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.periodButton,
                      selected.id === p.id && styles.periodButtonActive,
                    ]}
                    onPress={() => setSelected(p)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        selected.id === p.id && styles.periodButtonTextActive,
                      ]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {p.label}
                    </Text>
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
                    onPress={() => setSelected(p)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        selected.id === p.id && styles.periodButtonTextActive,
                      ]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date/heure du rapport */}
            {renderTimestamp()}

            <ScrollView style={styles.scroll}>
              {loading ? (
                <Text
                  style={styles.loadingText}
                  maxFontSizeMultiplier={1.2}
                >
                  Chargement…
                </Text>
              ) : (
                <>
                  {/* Récapitulatif de la période */}
                  <Text
                    style={styles.sectionTitle}
                    maxFontSizeMultiplier={1.2}
                  >
                    Récapitulatif pour la période sélectionnée
                  </Text>
                  <View style={styles.row}>
                    <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                      Exercices terminés
                    </Text>
                    <Text style={styles.value} maxFontSizeMultiplier={1.2}>
                      {stats.totalExercises}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                      Jours actifs
                    </Text>
                    <Text style={styles.value} maxFontSizeMultiplier={1.2}>
                      {stats.activeDays}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                      Score moyen
                    </Text>
                    <Text style={styles.value} maxFontSizeMultiplier={1.2}>
                      {stats.averageScore}%
                    </Text>
                  </View>

                  {/* Statistiques par exercice pour cette période */}
                  <Text
                    style={[styles.sectionTitle, { marginTop: 12 }]}
                    maxFontSizeMultiplier={1.2}
                  >
                    Statistiques par exercice pour cette période
                  </Text>

                  {EXERCISES.map((ex) => {
                    const s = perExerciseStats[ex.id];
                    const times = s?.timesCompleted ?? 0;
                    const avg =
                      s && typeof s.averageCompletionRate === 'number'
                        ? s.averageCompletionRate.toFixed(1)
                        : 0;

                    return (
                      <View key={ex.id} style={styles.exerciseRow}>
                        <Text
                          style={styles.exerciseLabel}
                          maxFontSizeMultiplier={1.2}
                        >
                          {ex.label}
                        </Text>
                        <Text
                          style={styles.exerciseSub}
                          maxFontSizeMultiplier={1.2}
                        >
                          Terminé:{' '}
                          <Text
                            style={styles.bold}
                            maxFontSizeMultiplier={1.2}
                          >
                            {times}
                          </Text>{' '}
                          | Score moyen:{' '}
                          <Text
                            style={styles.bold}
                            maxFontSizeMultiplier={1.2}
                          >
                            {avg}%
                          </Text>
                        </Text>
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
                <Text
                  style={styles.shareText}
                  maxFontSizeMultiplier={1.2}
                >
                  Partager le rapport
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text
                  style={styles.closeText}
                  maxFontSizeMultiplier={1.2}
                >
                  Fermer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ViewShot>
      </View>
    </Modal>
  );
};

export default StatsReportModalFr;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#fdfdfd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2D4769',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D4769',
    textAlign: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  userNameStrong: {
    fontWeight: 'bold',
    color: '#2D4769',
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
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 13,
    color: '#333',
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
  exerciseSub: {
    fontSize: 12,
    color: '#444',
    marginTop: 1,
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
  },
});
