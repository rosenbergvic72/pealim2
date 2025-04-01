import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated } from 'react-native';

const TypewriterTextRTL = ({ text, typingSpeed = 100, style }) => {
  const [displayedText, setDisplayedText] = useState('');
  const sizeAnim = useRef(new Animated.Value(30)).current; // начальный размер шрифта

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index += 1;
      if (index >= text.length) {
        clearInterval(timer);
        // После того как весь текст отображен, начинаем анимацию размера шрифта
        Animated.sequence([
          Animated.timing(sizeAnim, {
            toValue: 34, // временное увеличение размера шрифта
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(sizeAnim, {
            toValue: 30, // возвращение к исходному размеру
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [text, typingSpeed, sizeAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[{ fontSize: sizeAnim }, style]}maxFontSizeMultiplier={1.2}>
        {displayedText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    width: '100%',
    height: 50,
  },
});

export default TypewriterTextRTL;
