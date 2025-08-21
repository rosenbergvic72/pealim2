import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const BounceInView = ({ children, duration = 600, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
      delay,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {children}
    </Animated.View>
  );
};

export default BounceInView;
