// index.js — главный вход для Expo с полифиллом setImmediate

// 1) Полифилл setImmediate (для RN 0.77+)
import 'setimmediate';

// 2) Стандартный вход Expo
import 'expo/AppEntry';
