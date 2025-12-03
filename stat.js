// stat.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * (Опционально) лог всех ключей в AsyncStorage.
 * Раскомментируй logAllKeys() для отладки.
 */
async function logAllKeys() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All keys in AsyncStorage:', allKeys);
  } catch (error) {
    console.error('Error fetching keys from AsyncStorage:', error);
  }
}
// logAllKeys();

/**
 * Обновление статистики по упражнению:
 * 1) stats_<exerciseId>        — общая статистика за всё время
 * 2) daily_stats_<YYYY-MM-DD>  — дневная статистика + perExercise
 */
export async function updateStatistics(exerciseId, score) {
  const statsKey = `stats_${exerciseId}`;

  // Приводим к числу и защищаемся от NaN / бесконечностей
  let numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    console.warn(
      'updateStatistics: score is not finite number, skip. exerciseId=',
      exerciseId,
      'raw score=',
      score
    );
    return;
  }

  // При желании можно "зажать" результат в 0–100
  if (numericScore < 0) numericScore = 0;
  if (numericScore > 100) numericScore = 100;

  console.log(
    `updateStatistics: exerciseId=${exerciseId}, score=${numericScore}`
  );

  try {
    /* ===== 1. Общая статистика по упражнению (за всё время) ===== */
    const existingStatsRaw = await AsyncStorage.getItem(statsKey);
    console.log(`Existing stats raw for ${exerciseId}:`, existingStatsRaw);

    let stats;
    try {
      stats = existingStatsRaw ? JSON.parse(existingStatsRaw) : null;
    } catch (e) {
      console.warn(
        'updateStatistics: failed to parse existing stats, reset to defaults. exerciseId=',
        exerciseId,
        e
      );
      stats = null;
    }

    if (!stats || typeof stats !== 'object') {
      stats = {
        timesCompleted: 0,
        averageScore: 0.0,
        bestScore: 0.0,
        averageCompletionRate: 0.0,
        totalScore: 0.0,
      };
    }

    console.log('Before update (global):', stats);

    const prevTimes = Number(stats.timesCompleted) || 0;
    const prevTotal = Number(stats.totalScore) || 0;
    const prevBest = Number(stats.bestScore) || 0;

    const timesCompleted = prevTimes + 1;
    const totalScore = prevTotal + numericScore;
    const averageScore = timesCompleted > 0 ? totalScore / timesCompleted : 0;
    const bestScore = Math.max(prevBest, numericScore);
    const averageCompletionRate =
      timesCompleted > 0 ? totalScore / timesCompleted : 0;

    const updatedStats = {
      timesCompleted,
      totalScore,
      averageScore,
      bestScore,
      averageCompletionRate,
    };

    console.log('After update (global):', updatedStats);

    await AsyncStorage.setItem(statsKey, JSON.stringify(updatedStats));
    console.log(`Statistics successfully updated for ${exerciseId}`);

    /* ===== 2. Дневная статистика с perExercise ===== */
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dayKey = `daily_stats_${today}`;
    const dayRaw = await AsyncStorage.getItem(dayKey);

    let dayStats;
    try {
      dayStats = dayRaw ? JSON.parse(dayRaw) : null;
    } catch (e) {
      console.warn(
        'updateStatistics: failed to parse daily_stats, reset for today. key=',
        dayKey,
        e
      );
      dayStats = null;
    }

    if (!dayStats || typeof dayStats !== 'object') {
      dayStats = {
        date: today,
        exercisesCompleted: 0,
        totalScore: 0,
        perExercise: {},
      };
    }

    // защита от старого формата без perExercise
    if (!dayStats.perExercise || typeof dayStats.perExercise !== 'object') {
      dayStats.perExercise = {};
    }

    const dayPrevCount = Number(dayStats.exercisesCompleted) || 0;
    const dayPrevTotal = Number(dayStats.totalScore) || 0;

    dayStats.exercisesCompleted = dayPrevCount + 1;
    dayStats.totalScore = dayPrevTotal + numericScore;

    // поупражнённая часть
    const exPrev = dayStats.perExercise[exerciseId] || {
      timesCompleted: 0,
      totalScore: 0,
    };

    const exTimes = Number(exPrev.timesCompleted) || 0;
    const exTotal = Number(exPrev.totalScore) || 0;

    const exUpdated = {
      timesCompleted: exTimes + 1,
      totalScore: exTotal + numericScore,
    };

    dayStats.perExercise[exerciseId] = exUpdated;

    console.log('Updated dayStats:', dayStats);

    await AsyncStorage.setItem(dayKey, JSON.stringify(dayStats));
    console.log(`Daily stats updated for ${today}`);
  } catch (error) {
    console.error('Failed to update statistics:', error);
  }
}

/**
 * Получение общей статистики по упражнению (за всё время).
 */
export async function getStatistics(exerciseId) {
  const statsKey = `stats_${exerciseId}`;
  console.log(`Attempting to retrieve statistics for ${exerciseId}`);
  try {
    const statsRaw = await AsyncStorage.getItem(statsKey);
    console.log(`Retrieved statistics for ${exerciseId}:`, statsRaw);
    return statsRaw ? JSON.parse(statsRaw) : null;
  } catch (error) {
    console.error('Failed to retrieve statistics:', error);
    return null;
  }
}

/**
 * (Опционально) лог конкретного упражнения для отладки.
 */
async function logExerciseStats(exerciseId) {
  try {
    const stats = await AsyncStorage.getItem(`stats_${exerciseId}`);
    console.log(`Stats for ${exerciseId}:`, stats);
  } catch (error) {
    console.error(`Error fetching stats for ${exerciseId}:`, error);
  }
}
// logExerciseStats('exercise4');
