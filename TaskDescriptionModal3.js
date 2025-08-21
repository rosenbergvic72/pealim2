import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 3', 
    intro1: 'В этом упражнении вам предстоит определить биньян глагола на иврите.',
    intro2: 'Вам будет показан инфинитив глагола на иврите, а также четыре варианта биньяна. Ваша задача — выбрать правильный биньян, к которому принадлежит глагол.',
    intro3: 'Это упражнение подходит для тех, кто уже изучает иврит и имеет базовые знания о биньянах. Оно поможет лучше понимать структуру глаголов, быстрее узнавать их принадлежность к определённому биньяну и развить навык правильного употребления глаголов в речи.',
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    gender: 'Выбор голоса озвучивания',
    aiBot: 'ИИ чатбот',
    dontShow: 'Больше не показывать'
  },
  en: {
    title: 'TASK 3 DESCRIPTION',
    intro1: 'In this exercise, you need to identify the binyan (verb pattern) of a Hebrew verb.',
    intro2: 'You will be shown the infinitive of a Hebrew verb and four binyan options. Your task is to choose the correct binyan to which the verb belongs.',
    intro3: 'This exercise is suitable for learners who already have basic knowledge of Hebrew binyanim. It will help you better understand verb structures, quickly recognize their binyan, and improve your ability to use verbs correctly in speech.',
    section: 'Buttons',
    sound: 'Sound on/off buttons',
    stat: 'View exercise statistics',
    info: 'Exercise description',
    gender: 'Voice selection',
    aiBot: 'AI chatbot',
    dontShow: 'Do not show again'
  },
  
  fr: {
    title: 'DESCRIPTION DE L’EXERCICE 3',
    intro1: 'Dans cet exercice, vous devez identifier le binyan (modèle verbal) d’un verbe hébreu.',
    intro2: 'L’infinitif d’un verbe hébreu vous sera présenté avec quatre options de binyan. Votre tâche est de choisir le bon binyan auquel appartient le verbe.',
    intro3: 'Cet exercice est destiné à ceux qui ont déjà des connaissances de base sur les binyanim en hébreu. Il vous aidera à mieux comprendre la structure des verbes, à reconnaître rapidement leur binyan et à améliorer votre usage correct des verbes.',
    section: 'Boutons',
    sound: 'Boutons d’activation/désactivation du son',
    stat: 'Voir les statistiques de l’exercice',
    info: 'Description de l’exercice',
    gender: 'Choix de la voix',
    aiBot: 'Chatbot IA',
    dontShow: 'Ne plus afficher'
  },
  
  es: {
    title: 'DESCRIPCIÓN DEL EJERCICIO 3',
    intro1: 'En este ejercicio, deberás identificar el binyan (modelo verbal) de un verbo en hebreo.',
    intro2: 'Verás el infinitivo del verbo en hebreo junto con cuatro opciones de binyan. Tu tarea es elegir el binyan correcto al que pertenece el verbo.',
    intro3: 'Este ejercicio es ideal para quienes ya tienen conocimientos básicos sobre los binyanim. Te ayudará a comprender mejor la estructura de los verbos, reconocer más rápido su binyan y mejorar el uso correcto de los verbos en el habla.',
    section: 'Botones',
    sound: 'Botones para activar/desactivar el sonido',
    stat: 'Ver estadísticas del ejercicio',
    info: 'Descripción del ejercicio',
    gender: 'Selección de voz',
    aiBot: 'Chatbot con IA',
    dontShow: 'No mostrar de nuevo'
  },
  
  pt: {
    title: 'DESCRIÇÃO DO EXERCÍCIO 3',
    intro1: 'Neste exercício, você deverá identificar o binyan (modelo verbal) de um verbo em hebraico.',
    intro2: 'Será apresentado o infinitivo de um verbo em hebraico e quatro opções de binyan. Sua tarefa é escolher o binyan correto ao qual o verbo pertence.',
    intro3: 'Este exercício é indicado para quem já possui conhecimentos básicos sobre os binyanim. Ele ajudará a compreender melhor a estrutura dos verbos, reconhecer rapidamente o binyan e melhorar o uso correto dos verbos na fala.',
    section: 'Botões',
    sound: 'Botões de som',
    stat: 'Ver estatísticas do exercício',
    info: 'Descrição do exercício',
    gender: 'Escolha de voz',
    aiBot: 'Chatbot IA',
    dontShow: 'Não mostrar novamente'
  },
  
  ar: {
    title: 'وَصف التمرين 3',
    intro1: 'في هذا التمرين، عليك تحديد بِنْيان الفعل العبري (النمط الصرفي).',
    intro2: 'سيتم عرض الفعل بصيغة المصدر باللغة العبرية مع أربع خيارات للبنيان. مهمتك هي اختيار البنيان الصحيح الذي ينتمي إليه الفعل.',
    intro3: 'هذا التمرين مخصص لمن لديهم معرفة أساسية بالبنيانيم. سيساعدك على فهم بنية الأفعال بشكل أفضل، والتعرف بسرعة على نوع البنيان، وتحسين استخدامك الصحيح للأفعال في الكلام.',
    section: 'الأزرار',
    sound: 'أزرار تشغيل/إيقاف الصوت',
    stat: 'عرض إحصائيات التمرين',
    info: 'وصف التمرين',
    gender: 'اختيار الصوت',
    aiBot: 'روبوت الدردشة الذكي',
    dontShow: 'لا تظهر مرة أخرى'
  },
  
  am: {
    title: 'ልዩ ምልክት ስለ ልምድ 3',
    intro1: 'በዚህ ልምድ ውስጥ የዕብራይስጥ ግስ ቢንያን (የሰዋሰው አይነት) መለየት ይኖርብዎታል።',
    intro2: 'የግሱ ነፃ ቅርጽ በዕብራይስጥ ይታያል፣ ከዚህ ጋር አራት የቢንያን አማራጮች ይሆናሉ። ትክክለኛውን ምርጫ ይምረጡ።',
    intro3: 'ይህ ልምድ ቢንያንን በመጀመሪያ የተማሩ ሰዎች ይመረጣል። የግሶችን መዋቅር ማረዳትን፣ ቢንያን በፍጥነት መለየትን፣ ቃላትንም በትክክል መጠቀምን ይረዳዎታል።',
    section: 'አዝራሮች',
    sound: 'የድምፅ መቀያየሪያ አዝራሮች',
    stat: 'የልምድ ስታቲስቲክስን ይመልከቱ',
    info: 'የልምድ መግለጫ',
    gender: 'ድምፅ መምረጫ',
    aiBot: 'አርቲፊሻል ኢንተሊጀንስ ቻትቦት',
    dontShow: 'እንዳይታይ ያድርጉት'
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain3, onToggleDontShowAgain }) => {
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
            <View style={[styles.checkbox, dontShowAgain3 && styles.checkboxChecked]}>
              {dontShowAgain3 && <Text style={styles.checkmark}>✓</Text>}
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