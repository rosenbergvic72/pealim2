import { Platform } from 'react-native';

export const AR_TEXT = {
  writingDirection: 'rtl',
  // фиксируем семейство, чтобы AAB не подменял
  fontFamily: 'ar-regular',
  includeFontPadding: false,
};

export const AR_TEXT_BOLD = {
  ...AR_TEXT,
  fontFamily: 'ar-bold',
};
