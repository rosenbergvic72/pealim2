import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated } from 'react-native';

const TypewriterTextLTR = ({ text, typingSpeed = 100, style }) => {
  const [displayedText, setDisplayedText] = useState('');
  const sizeAnim = useRef(new Animated.Value(30)).current; // начальный размер шрифта

  useEffect(() => {
    let index = 0;
    let currentText = ''; // Локальная переменная для текста
    const timer = setInterval(() => {
      if (index < text.length) {
        currentText += text.charAt(index); // Добавляем символ к локальной переменной
        setDisplayedText(currentText); // Обновляем состояние
        index++;
      } else {
        clearInterval(timer); // Останавливаем таймер после завершения
        Animated.sequence([
          Animated.timing(sizeAnim, {
            toValue: 34, // Временное увеличение размера шрифта
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(sizeAnim, {
            toValue: 30, // Возвращение к исходному размеру
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, typingSpeed);

    return () => clearInterval(timer); // Чистим таймер при размонтировании
  }, [text, typingSpeed, sizeAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[{ fontSize: sizeAnim }, style]} maxFontSizeMultiplier={1.2}>
        {displayedText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    width: '100%',
    height: 56,
  },
});

export default TypewriterTextLTR;
