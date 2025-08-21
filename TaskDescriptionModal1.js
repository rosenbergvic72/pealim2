import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 1',
    intro1: 'В этом упражнении вы сможете запомнить и повторить около 300 самых употребляемых глаголов иврита.',
    intro2: 'Вам будет показан и озвучен инфинитив глагола на иврите и четыре варианта его перевода на русский язык. Ваша задача — выбрать правильный перевод.',
    intro3: 'Это упражнение помогает лучше запомнить употребление глаголов, развить навык быстрого перевода, а также улучшить восприятие речи на слух, что важно для свободного общения на иврите.',
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    gender: 'Выбор голоса озвучивания',
    aiBot: 'ИИ чатбот',
    dontShow: 'Больше не показывать'
  },
  en: {
    title: 'TASK DESCRIPTION 1',
    intro1: 'In this exercise, you will memorize and review about 300 of the most frequently used Hebrew verbs.',
    intro2: 'You will see and hear the infinitive form of a verb in Hebrew and four translation options. Your task is to choose the correct translation.',
    intro3: 'This exercise helps improve your memory, translation skills, and listening comprehension — essential for fluent Hebrew communication.',
    section: 'Buttons',
    sound: 'Sound on/off buttons',
    stat: 'View exercise statistics',
    info: 'Exercise description',
    gender: 'Voice gender selection',
    aiBot: 'AI Chatbot',
    dontShow: "Don't show again"
  },
  fr: {
    title: 'DESCRIPTION DE L’EXERCICE 1',
    intro1: "Dans cet exercice, vous allez mémoriser et réviser environ 300 verbes hébreux les plus courants.",
    intro2: "L'infinitif du verbe en hébreu sera affiché et lu, accompagné de quatre traductions possibles. Votre tâche est de choisir la bonne.",
    intro3: "Cet exercice aide à mieux mémoriser les verbes, à développer la traduction rapide et à améliorer la compréhension orale en hébreu.",
    section: 'Boutons',
    sound: 'Boutons activer/désactiver le son',
    stat: "Statistiques de l'exercice", 
    info: "Description de l'exercice",
    gender: 'Choix du genre de voix',
    aiBot: 'Chatbot IA',
    dontShow: 'Ne plus afficher'
  },
  es: {
    title: 'DESCRIPCIÓN DEL EJERCICIO 1',
    intro1: 'En este ejercicio, podrás memorizar y repasar unos 300 de los verbos hebreos más utilizados.',
    intro2: 'Se te mostrará y reproducirá el infinitivo del verbo en hebreo con cuatro opciones de traducción. Debes elegir la correcta.',
    intro3: 'Este ejercicio mejora la memorización, la traducción rápida y la comprensión auditiva, esenciales para hablar hebreo con fluidez.',
    section: 'Botones',
    sound: 'Botones para activar/desactivar sonido',
    stat: 'Ver estadísticas del ejercicio',
    info: 'Descripción del ejercicio',
    gender: 'Selección de voz (masc/fem)',
    aiBot: 'Chatbot IA',
    dontShow: 'No mostrar de nuevo'
  },
  pt: {
    title: 'DESCRIÇÃO DO EXERCÍCIO 1',
    intro1: 'Neste exercício, você vai memorizar e revisar cerca de 300 verbos hebraicos mais comuns.',
    intro2: 'Será mostrado e reproduzido o infinitivo do verbo em hebraico com quatro opções de tradução. Sua tarefa é escolher a correta.',
    intro3: 'Este exercício ajuda a memorizar os verbos, desenvolver tradução rápida e melhorar a compreensão auditiva em hebraico.',
    section: 'Botões',
    sound: 'Botões para ligar/desligar som',
    stat: 'Ver estatísticas do exercício',
    info: 'Descrição do exercício',
    gender: 'Selecionar voz (masculino/feminino)',
    aiBot: 'Chatbot IA',
    dontShow: 'Não mostrar novamente'
  },
  ar: {
    title: 'وَصْف التمرين 1',
    intro1: 'في هذا التمرين، ستتذكر وتراجع حوالي 300 من أكثر الأفعال العبرية استخدامًا.',
    intro2: 'سيُعرض عليك مصدر الفعل بالعبرية مع تشغيله صوتيًا وأربعة خيارات للترجمة. مهمتك اختيار الترجمة الصحيحة.',
    intro3: 'يساعد هذا التمرين على حفظ الأفعال، وتطوير مهارة الترجمة السريعة، وتحسين فهم اللغة المنطوقة — وهي أمور ضرورية للتحدث بطلاقة.',
    section: 'الأزرار',
    sound: 'زر تشغيل/إيقاف الصوت',
    stat: 'عرض إحصائيات التمرين',
    info: 'وصف التمرين',
    gender: 'اختيار صوت المتحدث',
    aiBot: 'روبوت الدردشة الذكي',
    dontShow: 'لا تظهر مرة أخرى'
  },
  am: {
    title: 'ልዩ የልምምድ መግለጫ 1',
    intro1: 'በዚህ ልምምድ ውስጥ በተለመዱት የሃብሪ ግሶች 300 በቀላሉ መታወቂያ እና መድገሚያ ይደረጋል።',
    intro2: 'የግስ ማንኛውም ቅድመ-ቅዱስ ቃል በኃብሪኛ ይታያልና ይተረጉማል፤ አራት መረጃዎች ይሰጣሉ። የትኛውን እንደት እንደሚሆን መምረጥ ነው ያለብዎት።',
    intro3: 'ይህ ልምምድ የግሶችን ማስታወቂያ እና ፈጣን ትርጉም ችሎታ ማሻሻልን እንዲሁም የመሰማት ክህሎት እንዲበረታ ያግዛል።',
    section: 'ቁልፎች',
    sound: 'ድምፅ ማንቃት/ማጥፋት',
    stat: 'የልምምድ ስታቲስቲክስ',
    info: 'የልምምድ መግለጫ',
    gender: 'የድምፅ አምራጭ',
    aiBot: 'የብሔራዊ አይ ቻትቦት',
    dontShow: 'እንደገና አታሳይም'
  },
};

const windowHeight = Dimensions.get('window').height;

const languageMap = {
  'русский': 'ru',
  'english': 'en',
  'français': 'fr',
  'español': 'es',
  'português': 'pt',
  'العربية': 'ar',
  'አማርኛ': 'am',
};  



const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain1, onToggleDontShowAgain }) => {
  const normalizedInput = (language || '').toLowerCase().trim();
  const langCode = languageMap[normalizedInput] || 'en';
  const t = translations[langCode];

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onToggle}>
      <View style={styles.centeredView}>
        <FadeInView style={styles.modalView}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={require('./VERBIFY.png')} style={styles.logo} />
            <TouchableOpacity onPress={onToggle}>
              <Text style={styles.closeButton} maxFontSizeMultiplier={1.2}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Скроллируемый текст */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollWrapper}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>{t.title}</Text>
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>{t.intro1}</Text>
            <Text style={[styles.modalText, styles.highlightText]} maxFontSizeMultiplier={1.2}>
              {'\n'}{t.intro2}
            </Text>
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>{t.intro3}</Text>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>{t.section}</Text>
            <View style={styles.screenshotWrapper}>
              <Image source={require('./scr1.jpg')} style={styles.screenshot} />
            </View>
            <View style={styles.iconRow}>
              <Image source={require('./SoundOn.png')} style={styles.icon} />
              <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>{t.sound}</Text>
            </View>
            <View style={styles.iconRow}>
              <Image source={require('./stat.png')} style={styles.icon} />
              <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>{t.stat}</Text>
            </View>
            <View style={styles.iconRow}>
              <Image source={require('./question.png')} style={styles.icon} />
              <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>{t.info}</Text>
            </View>
            <View style={styles.iconRow}>
              <Image source={require('./GenderMan.png')} style={styles.icon} />
              <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>{t.gender}</Text>
            </View>
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={styles.aiIconRow}>
                <Image source={require('./AI2.png')} style={styles.aiIcon} />
                <Text style={[styles.iconText, { flex: 0 }]} maxFontSizeMultiplier={1.2}>{t.aiBot}</Text>
              </View>
            </View>
          </ScrollView>
          {/* Фиксированный чекбокс вне скролла */}
          <TouchableOpacity style={styles.dontShowRow} onPress={onToggleDontShowAgain} activeOpacity={0.7}>
            <View style={[styles.checkbox, dontShowAgain1 && styles.checkboxChecked]}>
              {dontShowAgain1 && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.dontShowText} maxFontSizeMultiplier={1.2}>
              {t.dontShow}
            </Text>
          </TouchableOpacity>
        </FadeInView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  modalView: {
    width: '92%',
    height: windowHeight * 0.95,
    // maxHeight: Platform.OS === 'android'
    //   ? windowHeight * 0.98
    //   : windowHeight * 0.98,
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 50,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  closeButton: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    padding: 5,
  },
  scrollWrapper: {
    width: '100%',
    maxHeight: windowHeight * 0.88, // высота скролла меньше чем modalView
    marginBottom: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#2D4769',
    fontSize: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 1,
    color: '#2D4769',
  },
  screenshotWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFDEF',
    marginBottom: 10,
  },
  screenshot: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  icon: {
    width: 42,
    height: 42,
    marginRight: 10,
    resizeMode: 'contain',
  },
  iconText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  aiIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    height: 72,
    width: 72,
    resizeMode: 'contain',
    marginRight: 10,
  },
  dontShowRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
  marginBottom: 8,
  alignSelf: 'center',
  height: 40,
  backgroundColor: '#E0ECFF', // светло-синий фон
  borderRadius: 10,
  paddingHorizontal: 12,
  shadowColor: '#4880b4',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 4,
  elevation: 4, // для Android
},
checkbox: {
  width: 24,
  height: 24,
  borderWidth: 2,
  borderColor: '#4A6491',
  borderRadius: 6,
  marginRight: 10,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
  elevation: 1,
},
checkboxChecked: {
  backgroundColor: '#4A6491',
},
checkmark: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
dontShowText: {
  fontSize: 15,
  fontWeight: 'bold',
  color: '#17457D', // тёмно-синий, вместо красного для аккуратности
},

});

export default TaskDescriptionModal6;
