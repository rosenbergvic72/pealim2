import React, {
  useMemo,
} from 'react';

import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const LANGUAGE_ALIASES = {
  ru: 'ru',
  russian: 'ru',
  русский: 'ru',

  en: 'en',
  english: 'en',

  fr: 'fr',
  french: 'fr',
  français: 'fr',
  francais: 'fr',

  es: 'es',
  spanish: 'es',
  español: 'es',
  espanol: 'es',

  pt: 'pt',
  portuguese: 'pt',
  português: 'pt',
  portugues: 'pt',
  'pt-pt': 'pt',

  ar: 'ar',
  arabic: 'ar',
  arab: 'ar',
  العربية: 'ar',

  am: 'am',
  amharic: 'am',
  አማርኛ: 'am',

  he: 'he',
  iw: 'he',
  hebrew: 'he',
  עברית: 'he',
};

const normalizeLanguage = language => {
  const normalized =
    String(language || '')
      .trim()
      .toLowerCase();

  return (
    LANGUAGE_ALIASES[normalized] ||
    'en'
  );
};

const TEXTS = {
  ru: {
    title:
      'Вы действительно хотите выйти?',

    message:
      'Прогресс выполнения упражнения не сохранится.',

    confirm: 'ДА',
    cancel: 'НЕТ',
  },

  en: {
    title:
      'Are you sure you want to exit?',

    message:
      'Your progress in this exercise will not be saved.',

    confirm: 'YES',
    cancel: 'NO',
  },

  fr: {
    title:
      'Voulez-vous vraiment quitter l’exercice ?',

    message:
      'Votre progression dans cet exercice ne sera pas enregistrée.',

    confirm: 'OUI',
    cancel: 'NON',
  },

  es: {
    title:
      '¿Seguro que quieres salir?',

    message:
      'El progreso de este ejercicio no se guardará.',

    confirm: 'SÍ',
    cancel: 'NO',
  },

  pt: {
    title:
      'Tem a certeza de que pretende sair?',

    message:
      'O progresso deste exercício não será guardado.',

    confirm: 'SIM',
    cancel: 'NÃO',
  },

  ar: {
    title:
      'هل تريد حقًا الخروج؟',

    message:
      'لن يتم حفظ تقدمك في هذا التمرين.',

    confirm: 'نعم',
    cancel: 'لا',
  },

  am: {
    title:
      'በእርግጥ ከልምምዱ መውጣት ይፈልጋሉ?',

    message:
      'በዚህ ልምምድ ያደረጉት እድገት አይቀመጥም።',

    confirm: 'አዎ',
    cancel: 'አይ',
  },

  he: {
    title:
      'האם באמת לצאת מהתרגיל?',

    message:
      'ההתקדמות בתרגיל לא תישמר.',

    confirm: 'כן',
    cancel: 'לא',
  },
};

const PrepositionExitConfirmationModal = ({
  visible,
  language,
  onCancel,
  onConfirm,
}) => {
  const normalizedLanguage =
    normalizeLanguage(language);

  const text =
    TEXTS[normalizedLanguage] ||
    TEXTS.en;

  const isRTL =
    normalizedLanguage === 'ar' ||
    normalizedLanguage === 'he';

  const directionStyle = useMemo(
    () => ({
      textAlign:
        isRTL ? 'right' : 'center',

      writingDirection:
        isRTL ? 'rtl' : 'ltr',
    }),
    [isRTL]
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text
            style={[
              styles.title,
              directionStyle,
            ]}
            maxFontSizeMultiplier={1.2}
          >
            {text.title}
          </Text>

          <Text
            style={[
              styles.message,
              directionStyle,
            ]}
            maxFontSizeMultiplier={1.2}
          >
            {text.message}
          </Text>

          <View
            style={[
              styles.buttonContainer,

              isRTL &&
                styles.buttonContainerRTL,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
              ]}
              activeOpacity={0.75}
              onPress={onConfirm}
            >
              <Text
                style={styles.buttonText}
                maxFontSizeMultiplier={1.2}
              >
                {text.confirm}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
              ]}
              activeOpacity={0.75}
              onPress={onCancel}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.cancelButtonText,
                ]}
                maxFontSizeMultiplier={1.2}
              >
                {text.cancel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 18,

    backgroundColor:
      'rgba(0,0,0,0.55)',
  },

  modalContent: {
    width: '100%',
    maxWidth: 420,

    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,

    borderRadius: 20,

    alignItems: 'center',

    backgroundColor: '#FFFDEF',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.25,
    shadowRadius: 8,

    elevation: 8,
  },

  title: {
    width: '100%',

    marginBottom: 14,

    color: '#333652',

    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',

    textAlign: 'center',
  },

  message: {
    width: '100%',

    marginBottom: 24,

    color: '#6B708A',

    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',

    textAlign: 'center',
  },

  buttonContainer: {
    width: '100%',

    flexDirection: 'row',

    justifyContent:
      'space-between',

    gap: 12,
  },

  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },

  button: {
    flex: 1,

    minHeight: 52,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 12,
  },

  confirmButton: {
    backgroundColor: '#CE6857',
  },

  cancelButton: {
    borderWidth: 2,
    borderColor: '#2D4769',

    backgroundColor: '#FFFDEF',
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '900',

    textAlign: 'center',
  },

  cancelButtonText: {
    color: '#2D4769',
  },
});

export default PrepositionExitConfirmationModal;