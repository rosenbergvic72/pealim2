import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
// import CheckBox from '@react-native-community/checkbox';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import { Animated } from 'react-native';
// import { useRef } from 'react';
import FadeInView from './api/FadeInView';



const translations = {
  ru: {
    intro: 'Выберите правильный перевод глагола. Используйте кнопки для переключения пола и просмотра статистики.',
    more: 'Подробнее',
    dontShowAgain: 'Не показывать снова',
  },
  en: {
    intro: 'Choose the correct translation of the verb. Use buttons to switch gender and view statistics.',
    more: 'More Info',
    dontShowAgain: "Don't show again",
  },
  fr: {
    intro: "Choisissez la bonne traduction du verbe. Utilisez les boutons pour changer de genre et voir les statistiques.",
    more: 'En savoir plus',
    dontShowAgain: 'Ne plus afficher',
  },
  es: {
    intro: 'Elige la traducción correcta del verbo. Usa los botones para cambiar el género y ver estadísticas.',
    more: 'Más información',
    dontShowAgain: 'No mostrar de nuevo',
  },
  pt: {
    intro: 'Escolha a tradução correta do verbo. Use os botões para alterar o gênero e ver estatísticas.',
    more: 'Mais informações',
    dontShowAgain: 'Não mostrar novamente',
  },
  ar: {
    intro: 'اختر الترجمة الصحيحة للفعل. استخدم الأزرار لتغيير الجنس وعرض الإحصائيات.',
    more: 'المزيد من المعلومات',
    dontShowAgain: 'لا تظهر مرة أخرى',
  },
  am: {
    intro: 'አእዌ ደመሪን የኣደለል ከአንዳዊል ሐማለን ለንስናይት ለስዩ.',
    more: 'ማርም',
    dontShowAgain: 'የአደለ የስሜል ከንዶሊያት ዋዊላ',
  }
};

const FirstTimeInstructionModal1 = ({ visible, onClose, language, openDetailedModal }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const lang = translations[language] ? language : 'en';

  const getLangCode = (lang) => {
    if (!lang || typeof lang !== 'string') return 'en';
    const lower = lang.toLowerCase();
    if (lower.startsWith('ру')) return 'ru';
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('pt')) return 'pt';
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('am')) return 'am';
    return 'en'; // fallback
  };
  
  const langCode = getLangCode(language);

  useEffect(() => {
    const loadFlag = async () => {
      const value = await AsyncStorage.getItem(`exercise1_instruction_seen_${language}`);
      setDontShowAgain(value === 'true');
    };
    loadFlag();
  }, [language]);

  const toggleCheckbox = async () => {
    const newValue = !dontShowAgain;
    setDontShowAgain(newValue);
    await AsyncStorage.setItem(`exercise1_instruction_seen_${language}`, newValue ? 'true' : '');
  };
  
  

  const handleMoreInfo = async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem(`exercise1_instruction_seen_${language}`, 'true');
    }
    onClose();
    openDetailedModal();
  };

  const handleClose = async () => {
    if (dontShowAgain) {
        await AsyncStorage.setItem(`exercise1_instruction_seen_${language}`, 'true');
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
  <View style={styles.overlay}>
    <FadeInView style={styles.animatedWrapper}>
      <View style={styles.modalBox}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{langCode.toUpperCase()}</Text>
        <Text style={styles.text}>{translations[langCode].intro}</Text>

        <Video
          source={require('./assets/videos/ex1z.mp4')}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay
          useNativeControls
          style={styles.video}
        />

        <TouchableOpacity onPress={toggleCheckbox} style={styles.fakeCheckboxContainer}>
          <View style={[styles.fakeCheckbox, dontShowAgain && styles.fakeCheckboxChecked]} />
          <Text style={styles.label}>{translations[langCode].dontShowAgain}</Text>
        </TouchableOpacity>

        <View style={styles.singleButtonContainer}>
          <TouchableOpacity onPress={handleMoreInfo} style={styles.button}>
            <Text style={styles.buttonText}>{translations[langCode].more}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeInView>
  </View>
</Modal>

  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFDEF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  video: {
    width: '100%',
    // height: 360,
    height: hp('60%'), // например, 30% от высоты экрана
    backgroundColor: 'black', // добавь для наглядности
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4A6491',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fakeCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  
  fakeCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#4A6491',
    marginRight: 8,
    borderRadius: 4,
  },
  
  fakeCheckboxChecked: {
    backgroundColor: '#4A6491',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8,
  },
  
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  
  singleButtonContainer: {
    width: '100%',
    alignItems: 'center',
    // marginTop: 10,
  },
  animatedWrapper: {
    width: '90%',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFFDEF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  
  
});

export default FirstTimeInstructionModal1;
