import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';

const texts = {
  en: {
    title: '🔓 UNLOCK ALL EXERCISES',
    subtitleAndroid: '5 days free for new subscribers',
    subtitleIOS: '7 days free for new subscribers',
    note: 'Cancel anytime',
  },
  ru: {
    title: '🔓 ОТКРОЙТЕ ВСЕ УПРАЖНЕНИЯ',
    subtitleAndroid: 'Бесплатно 5 дней для новых подписчиков',
    subtitleIOS: '7 дней бесплатно для новых подписчиков',
    note: 'Отменить можно в любой момент',
  },
  fr: {
    title: '🔓 DÉBLOQUEZ TOUS LES EXERCICES',
    subtitleAndroid: '5 jours gratuits pour les nouveaux abonnés',
    subtitleIOS: '7 jours gratuits pour les nouveaux abonnés',
    note: 'Annulez à tout moment',
  },
  es: {
    title: '🔓 DESBLOQUEA TODOS LOS EJERCICIOS',
    subtitleAndroid: '5 días gratis para nuevos suscriptores',
    subtitleIOS: '7 días gratis para nuevos suscriptores',
    note: 'Cancela en cualquier momento',
  },
  pt: {
    title: '🔓 DESBLOQUEIE TODOS OS EXERCÍCIOS',
    subtitleAndroid: '5 dias grátis para novos assinantes',
    subtitleIOS: '7 dias grátis para novos assinantes',
    note: 'Cancele a qualquer momento',
  },
  ar: {
    title: '🔓 افتح جميع التمارين',
    subtitleAndroid: '5 أيام مجانًا للمشتركين الجدد',
    subtitleIOS: '7 أيام مجانًا للمشتركين الجدد',
    note: 'يمكن الإلغاء في أي وقت',
  },
  am: {
    title: '🔓 ሁሉንም ልምምዶች ክፈት',
    subtitleAndroid: 'ለአዲስ ተመዝጋቢዎች 5 ቀናት በነፃ',
    subtitleIOS: 'ለአዲስ ተመዝጋቢዎች 7 ቀናት በነፃ',
    note: 'በማንኛውም ጊዜ መሰረዝ ይቻላል',
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
  const subtitle = Platform.OS === 'ios' ? t.subtitleIOS : t.subtitleAndroid;

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
            {subtitle}
          </Text>

          <Text style={styles.note} maxFontSizeMultiplier={1.2}>
            {t.note}
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
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  note: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});