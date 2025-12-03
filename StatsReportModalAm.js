// StatsReportModalAm.js
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

// ፒሪዮዶች – 4 በላይ እና 4 በታች
const PERIODS = [
  { id: '1d',  label: '1 ቀን',      days: 1 },
  { id: '2d',  label: '2 ቀናት',    days: 2 },
  { id: '3d',  label: '3 ቀናት',    days: 3 },
  { id: '5d',  label: '5 ቀናት',    days: 5 },
  { id: '7d',  label: '1 ሳምንት',   days: 7 },
  { id: '14d', label: '2 ሳምንታት', days: 14 },
  { id: '30d', label: '1 ወር',      days: 30 },
  { id: '60d', label: '2 ወራት',    days: 60 },
];

const TOP_PERIODS = PERIODS.slice(0, 4);
const BOTTOM_PERIODS = PERIODS.slice(4);

// የልምምዶች ዝርዝር (አማርኛ ቅርንጫፍ)
const EXERCISES = [
  { id: 'exercise1Am', label: 'ልምምድ 1' },
  { id: 'exercise2Am', label: 'ልምምድ 2' },
  { id: 'exercise3Am', label: 'ልምምድ 3' },
  { id: 'exercise5Am', label: 'ልምምድ 4' },
  { id: 'exercise6Am', label: 'ልምምድ 5' },
  { id: 'exercise8Am', label: 'ልምምድ 6' },
  { id: 'exercise4Am', label: 'ልምምድ 7' },
  { id: 'exercise7Am', label: 'ልምምድ 8' },
];

const StatsReportModalAm = ({ visible, onClose }) => {
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

  // ሞዳሉ ሲከፈት የተጠቃሚውን ስም መጫን
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

  // ሞዳሉ ሲከፈት / ፒሪዮድ ሲቀየር ውሂብ መጫን
  useEffect(() => {
    if (!visible) return;
    loadPeriodStats(selected.days);
    loadPerExerciseStats(selected.days);
  }, [visible, selected]);

  // ጠቅላላ ስታቲስቲክስ ለፒሪዮዱ (daily_stats_YYYY-MM-DD)
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

  // የእያንዳንዱ ልምምድ ስታቲስቲክስ ለፒሪዮዱ (daily_exercise_exId_YYYY-MM-DD)
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
          const iso = d.toISOString().split('T')[0];
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

      // 1) የሪፖርቱን ካርድ እንደ ምስል መያዝ
      const uri = await viewShotRef.current.capture();
      const available = await Sharing.isAvailableAsync();

      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `የ${userName || ''} እድገት ለ ${selected.label}`,
        });
        return;
      }

      // 2) እሱ ካልቻለ ባለመደበኛው Share
      const timeString = generatedAt
        ? generatedAt.toLocaleString('am-ET')
        : '—';

      await Share.share({
        title: `የ Verbify እድገት ሪፖርት ለ ${selected.label}`,
        message: `የ${userName || 'ተጠቃሚው'} እድገት ለ ${selected.label} (ሪፖርቱ ተዘጋጀበት ጊዜ: ${timeString})`,
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
        ሪፖርቱ ተዘጋጀበት፡{' '}
        <Text style={styles.timestamp} maxFontSizeMultiplier={1.2}>
          {generatedAt.toLocaleString('am-ET')}
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
              የእድገት ስታቲስቲክስ
            </Text>

            {/* የተጠቃሚ ስም */}
            <Text style={styles.userName} maxFontSizeMultiplier={1.2}>
              <Text
                style={styles.userNameStrong}
                maxFontSizeMultiplier={1.2}
              >
                {userName || '—'}
              </Text>
            </Text>

            {/* የጊዜ መምረጫ ቁልፎች */}
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

            {/* የሪፖርቱ ቀን / ሰዓት */}
            {renderTimestamp()}

            <ScrollView style={styles.scroll}>
              {loading ? (
                <Text
                  style={styles.loadingText}
                  maxFontSizeMultiplier={1.2}
                >
                  በመጫን ላይ…
                </Text>
              ) : (
                <>
                  {/* ጠቅላላ ውጤት ለተመረጠው ጊዜ */}
                  <Text
                    style={styles.sectionTitle}
                    maxFontSizeMultiplier={1.2}
                  >
                    ለተመረጠው ጊዜ ጠቅላላ ውጤት
                  </Text>
                  <View style={styles.row}>
                    <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                      የተጠናቀቁ ልምምዶች
                    </Text>
                    <Text style={styles.value} maxFontSizeMultiplier={1.2}>
                      {stats.totalExercises}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                      ንቁ ቀናት
                    </Text>
                    <Text style={styles.value} maxFontSizeMultiplier={1.2}>
                      {stats.activeDays}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                      አማካይ ውጤት
                    </Text>
                    <Text style={styles.value} maxFontSizeMultiplier={1.2}>
                      {stats.averageScore}%
                    </Text>
                  </View>

                  {/* የእያንዳንዱ ልምምድ ስታቲስቲክስ ለዚህ ጊዜ */}
                  <Text
                    style={[styles.sectionTitle, { marginTop: 12 }]}
                    maxFontSizeMultiplier={1.2}
                  >
                    የእያንዳንዱ ልምምድ ስታቲስቲክስ (ለዚህ ጊዜ)
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
                          ተጠናቀቀ፡{' '}
                          <Text
                            style={styles.bold}
                            maxFontSizeMultiplier={1.2}
                          >
                            {times}
                          </Text>{' '}
                          | አማካይ ውጤት፡{' '}
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
                  ሪፖርቱን አጋራ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text
                  style={styles.closeText}
                  maxFontSizeMultiplier={1.2}
                >
                  ዝጋ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ViewShot>
      </View>
    </Modal>
  );
};

export default StatsReportModalAm;

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
