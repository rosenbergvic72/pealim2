import React from 'react';
import { Platform, Text } from 'react-native';

if (Platform.OS === 'ios') {
  const oldRender = Text.render;

  Text.render = function render(...args) {
    const origin = oldRender.call(this, ...args);
    const props = origin?.props || {};

    const styles = Array.isArray(props.style) ? props.style : [props.style];

    const patched = styles.map((s) => {
      if (!s) return s;

      const fw = s.fontWeight;

      // Проверяем, был ли текст жирным
      const isBold =
        fw === 'bold' ||
        fw === '700' ||
        fw === '800' ||
        fw === '900';

      if (!isBold) return s;

      const newStyle = { ...s };

      // 🔹 уменьшаем жирность
      newStyle.fontWeight = '500';

      // 🔹 увеличиваем размер только для bold
      if (typeof s.fontSize === 'number') {
        newStyle.fontSize = s.fontSize + 1;
      }

      return newStyle;
    });

    return React.cloneElement(origin, { style: patched });
  };
}
