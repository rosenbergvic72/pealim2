// animatedTimingPatch.js
import { Animated } from 'react-native';

if (!global.__ANIMATED_TIMING_PATCHED__) {
  const originalTiming = Animated.timing;

  Animated.timing = (value, config = {}) => {
    const label = config._debugLabel || 'no-label';
    const valueType =
      value instanceof Animated.Value ? 'AnimatedValue' : typeof value;
    const extensible =
      value && typeof value === 'object' && Object.isExtensible(value);

    console.log(
      '[Animated.timing] create',
      label,
      'extensible =',
      extensible,
      'valueType =',
      valueType
    );

    // 🧯 ГЛАВНАЯ ЗАЩИТА: если value уже non-extensible — не создаём "настоящую" анимацию
    if (!extensible) {
      console.log(
        '[Animated.timing] NON-EXTENSIBLE VALUE → return NOOP animation for',
        label
      );

      // No-op анимация с таким же API (start/stop/reset), чтобы код не ломался
      return {
        start: (callback) => {
          console.log(
            '[Animated.timing] start NOOP for',
            label,
            '(non-extensible value)'
          );
          if (callback) {
            // имитируем успешное завершение
            callback({ finished: true });
          }
        },
        stop: () => {
          console.log('[Animated.timing] stop NOOP for', label);
        },
        reset: () => {
          console.log('[Animated.timing] reset NOOP for', label);
        },
      };
    }

    const animation = originalTiming(value, config);
    const originalStart = animation.start;

    animation.start = (callback) => {
      const nowExtensible =
        value && typeof value === 'object' && Object.isExtensible(value);

      console.log(
        '[Animated.timing] start',
        label,
        'extensible =',
        nowExtensible,
        'valueType =',
        valueType
      );

      // 🔒 Если объект успел стать non-extensible перед стартом — тоже не падаем
      if (!nowExtensible) {
        console.log(
          '[Animated.timing] NON-EXTENSIBLE VALUE STACK for',
          label,
          new Error().stack
        );
        if (callback) {
          callback({ finished: false });
        }
        // НИЧЕГО не запускаем, просто выходим
        return;
      }

      return originalStart.call(animation, callback);
    };

    return animation;
  };

  global.__ANIMATED_TIMING_PATCHED__ = true;
}
