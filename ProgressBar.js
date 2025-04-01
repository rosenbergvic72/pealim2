import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Vibration } from 'react-native';

const ProgressBar = ({ progress, totalExercises }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedColor = useRef(new Animated.Value(0)).current;
  // Изменим подход к анимации высоты, используя transform для масштабирования
  const scaleAnim = useRef(new Animated.Value(1)).current; // начальный масштаб

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: (progress / totalExercises) * 100,
      duration: 500,
      useNativeDriver: false, // Для анимации ширины и цвета фона useNativeDriver должен быть false
    }).start();

    Animated.timing(animatedColor, {
      toValue: progress / totalExercises,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Анимация изменения масштаба
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.25, // немного увеличиваем
        duration: 200,
        useNativeDriver: true, // используем нативный драйвер для анимации transform
      }),
      Animated.timing(scaleAnim, {
        toValue: 1, // возвращаем к исходному
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (progress === totalExercises) {
      Vibration.vibrate(100);
    }
  }, [progress, totalExercises]);

  const barColor = animatedColor.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFBCBC', '#FBDC6A', '#AFFFCA'],
  });

  return (
    <View style={styles.Barcontainer}>
      <Animated.View style={[styles.ProgressBarcontainer, { transform: [{ scaleY: scaleAnim }] }]}>
        <Animated.View style={[styles.bar, {
          width: animatedWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          backgroundColor: barColor,
        }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  Barcontainer: {
    height: 20, // установите фиксированную высоту, чтобы предотвратить изменение размеров контейнера
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 5  
  },
  ProgressBarcontainer: {
    width: "100%",
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden', // Убедитесь, что анимируемый контент не выходит за пределы контейнера
  },
  bar: {
    height: '100%', // вместо анимации высоты, позволяет bar заполнять контейнер
    borderRadius: 5,
  },
});

export default ProgressBar;
  