import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const TypewriterTextRTL = ({ text, typingSpeed = 100, style, onDone }) => {
  const [displayedText, setDisplayedText] = useState('');
  const sizeAnim = useRef(new Animated.Value(30)).current;
  const doneRef = useRef(false);

  useEffect(() => {
    let index = 0;
    let currentText = '';
    doneRef.current = false;
    setDisplayedText('');

    const timer = setInterval(() => {
      if (index < text.length) {
        currentText += text.charAt(index);
        setDisplayedText(currentText);
        index++;
      } else {
        clearInterval(timer);

        // ✅ call onDone once per text
        if (!doneRef.current) {
          doneRef.current = true;
          if (typeof onDone === 'function') onDone();
        }

        Animated.sequence([
          Animated.timing(sizeAnim, {
            toValue: 34,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(sizeAnim, {
            toValue: 30,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [text, typingSpeed, sizeAnim, onDone]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[{ fontSize: sizeAnim, writingDirection: 'rtl' }, style]}
        maxFontSizeMultiplier={1.2}
      >
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
