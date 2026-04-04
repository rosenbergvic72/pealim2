import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';

const texts = {
  en: {
    title: '🔓 UNLOCK ALL EXERCISES',
    subtitle: 'Get full access to all exercises',
  },
  ru: {
    title: '🔓 ОТКРОЙТЕ ВСЕ УПРАЖНЕНИЯ',
    subtitle: 'Получите полный доступ ко всем упражнениям',
  },
  fr: {
    title: '🔓 DÉBLOQUEZ TOUS LES EXERCICES',
    subtitle: 'Obtenez un accès complet à tous les exercices',
  },
  es: {
    title: '🔓 DESBLOQUEA TODOS LOS EJERCICIOS',
    subtitle: 'Obtén acceso completo a todos los ejercicios',
  },
  pt: {
    title: '🔓 DESBLOQUEIE TODOS OS EXERCÍCIOS',
    subtitle: 'Obtenha acesso completo a todos os exercícios',
  },
  ar: {
    title: '🔓 افتح جميع التمارين',
    subtitle: 'احصل على وصول كامل إلى جميع التمارين',
  },
  am: {
    title: '🔓 ሁሉንም ልምምዶች ክፈት',
    subtitle: 'ሁሉንም ልምምዶች በሙሉ ይድረሱባቸው',
  },
};

const getPaywallRoute = () => {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
};

export default function UpgradeBanner({
  hasPro,
  navigation,
  language = 'en',
  animatedStyle = {},
}) {
  if (hasPro) return null;

  const t = texts[language] || texts.en;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate(getPaywallRoute())}
        style={styles.touch}
      >
        <View style={styles.inner}>
          <Text style={styles.title} maxFontSizeMultiplier={1.2}>
            {t.title}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
            {t.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#bd462a',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#2D4769',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touch: {
    width: '100%',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});