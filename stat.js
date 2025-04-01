import AsyncStorage from '@react-native-async-storage/async-storage';

async function logAllKeys() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All keys in AsyncStorage:', allKeys);
  } catch (error) {
    console.error('Error fetching keys from AsyncStorage:', error);
  }
}

logAllKeys();

// Функция для обновления статистики

export async function updateStatistics(exerciseId, score) {
  const statsKey = `stats_${exerciseId}`;
  score = parseFloat(score); // Убедитесь, что score всегда числовой
  console.log(`Attempting to update statistics for ${exerciseId} with score ${score}`);

  try {
    const existingStats = await AsyncStorage.getItem(statsKey);

    const savedStats = await AsyncStorage.getItem(statsKey);
console.log('Saved stats for exercise4:', savedStats);

    console.log(`Existing stats:`, existingStats);
    
    let stats = existingStats ? JSON.parse(existingStats) : { timesCompleted: 0, averageScore: 0.0, bestScore: 0.0, averageCompletionRate: 0.0 };

    console.log('Before update:', stats); // Лог перед началом изменений
    
    stats.timesCompleted += 1;
    // stats.averageScore = ((parseFloat(stats.averageScore) * (stats.timesCompleted - 1)) + score) / stats.timesCompleted;
    stats.averageScore = ((parseFloat(stats.averageScore) * (stats.timesCompleted - 1)) + score) / stats.timesCompleted;
    stats.bestScore = Math.max(parseFloat(stats.bestScore), score);
    // stats.averageCompletionRate = ((parseFloat(stats.averageCompletionRate) * (stats.timesCompleted - 1)) + score) / stats.timesCompleted;
    stats.totalScore = (parseFloat(stats.totalScore) || 0) + score;
    stats.averageCompletionRate = stats.totalScore / stats.timesCompleted;


    console.log('After calculation:', stats); // Лог после выполнения всех расчетов

    console.log(`New stats to be saved for ${exerciseId}:`, stats);
    await AsyncStorage.setItem(statsKey, JSON.stringify(stats));
    console.log(`Statistics successfully updated for ${exerciseId}`);
  } catch (error) {
    console.error("Failed to update statistics:", error);
  }
}

async function logExercise4Stats() {
  try {
    const stats = await AsyncStorage.getItem('stats_exercise4');
    console.log('Stats for exercise4:', stats);
  } catch (error) {
    console.error('Error fetching stats for exercise4:', error);
  }
}

logExercise4Stats();

// Функция для получения статистики
export async function getStatistics(exerciseId) {
  const statsKey = `stats_${exerciseId}`;
  console.log(`Attempting to retrieve statistics for ${exerciseId}`);
  try {
    const stats = await AsyncStorage.getItem(statsKey);
    console.log(`Retrieved statistics for ${exerciseId}:`, stats);
    return stats ? JSON.parse(stats) : null;
  } catch (error) {
    console.error("Failed to retrieve statistics:", error);
    return null;
  }
}

// Осторожно, это удалит все данные из AsyncStorage
// AsyncStorage.clear();
