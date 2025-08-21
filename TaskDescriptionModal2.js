import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  
    ru: {
      title: 'ОПИСАНИЕ ЗАДАНИЯ 2', 
      intro1: 'В этом упражнении вы сможете запомнить и повторить около 300 самых употребляемых глаголов иврита.', 
      intro2: 'Вам будет показан инфинитив глагола на русском языке, а также четыре варианта его перевода на иврит. Ваша задача — выбрать правильный вариант.',
      intro3: 'После ответа вам будет предложено простое озвученное предложение с этим глаголом на иврите, что поможет лучше запомнить его использование и произношение. Это упражнение способствует расширению словарного запаса, улучшению навыков перевода и восприятия ивритской речи на слух.', 
      section: 'Кнопки',
      sound: 'Кнопки включения и отключения звука',
      stat: 'Просмотр статистики упражнения',
      info: 'Описание упражнения',
      gender: 'Выбор голоса озвучивания',
      aiBot: 'ИИ чатбот',
      dontShow: 'Больше не показывать'
    },
    en: {
      title: 'TASK 2 DESCRIPTION',
      intro1: 'In this exercise, you will be able to memorize and review about 300 of the most common Hebrew verbs.',
      intro2: 'You will be shown the infinitive of a verb in English, along with four options for its translation into Hebrew. Your task is to choose the correct one.',
      intro3: 'After answering, you will hear a simple sentence with this verb in Hebrew, which will help you better remember its usage and pronunciation. This exercise helps expand your vocabulary and improve your translation and listening skills in Hebrew.',
      section: 'Buttons',
      sound: 'Sound on/off buttons',
      stat: 'View exercise statistics',
      info: 'Exercise description',
      gender: 'Voice selection',
      aiBot: 'AI chatbot',
      dontShow: 'Do not show again'
    },
    
    fr: {
      title: 'DESCRIPTION DE L’EXERCICE 2',
      intro1: 'Dans cet exercice, vous pourrez mémoriser et réviser environ 300 des verbes hébreux les plus courants.',
      intro2: 'L’infinitif du verbe vous sera présenté en français, avec quatre options de traduction en hébreu. Votre tâche est de choisir la bonne réponse.',
      intro3: 'Après votre réponse, une phrase simple avec ce verbe en hébreu vous sera proposée avec audio, ce qui vous aidera à retenir son utilisation et sa prononciation. Cet exercice aide à enrichir votre vocabulaire et à améliorer vos compétences en traduction et en compréhension orale en hébreu.',
      section: 'Boutons',
      sound: 'Boutons d’activation/désactivation du son',
      stat: 'Voir les statistiques de l’exercice',
      info: 'Description de l’exercice',
      gender: 'Choix de la voix',
      aiBot: 'Chatbot IA',
      dontShow: 'Ne plus afficher'
    },
    
    es: {
      title: 'DESCRIPCIÓN DEL EJERCICIO 2',
      intro1: 'En este ejercicio podrás memorizar y repasar unos 300 de los verbos hebreos más comunes.',
      intro2: 'Se te mostrará el infinitivo del verbo en español, junto con cuatro opciones de traducción al hebreo. Tu tarea es elegir la correcta.',
      intro3: 'Después de responder, escucharás una frase simple con ese verbo en hebreo, lo que te ayudará a recordar mejor su uso y pronunciación. Este ejercicio contribuye a ampliar tu vocabulario y mejorar tus habilidades de traducción y comprensión auditiva en hebreo.',
      section: 'Botones',
      sound: 'Botones de sonido',
      stat: 'Ver estadísticas del ejercicio',
      info: 'Descripción del ejercicio',
      gender: 'Selección de voz',
      aiBot: 'Chatbot de IA',
      dontShow: 'No mostrar de nuevo'
    },
    pt: {
      title: 'DESCRIÇÃO DO EXERCÍCIO 2',
      intro1: 'Neste exercício, você poderá memorizar e revisar cerca de 300 dos verbos hebraicos mais comuns.',
      intro2: 'Será mostrado o infinitivo do verbo em português, com quatro opções de tradução para o hebraico. Sua tarefa é escolher a correta.',
      intro3: 'Após a resposta, será apresentada uma frase simples com esse verbo em hebraico com áudio, o que ajudará você a lembrar melhor seu uso e pronúncia. Este exercício ajuda a expandir seu vocabulário e a melhorar suas habilidades de tradução e compreensão auditiva em hebraico.',
      section: 'Botões',
      sound: 'Botões de som',
      stat: 'Ver estatísticas do exercício',
      info: 'Descrição do exercício',
      gender: 'Seleção de voz',
      aiBot: 'Chatbot IA',
      dontShow: 'Não mostrar novamente'
    },
    
    ar: {
      title: 'وَصف التمرين 2',
      intro1: 'في هذا التمرين، يمكنك حفظ ومراجعة حوالي 300 من أكثر الأفعال العبرية شيوعًا.',
      intro2: 'سيتم عرض الفعل بصيغة المصدر باللغة العربية، إلى جانب أربع ترجمات ممكنة إلى العبرية. مهمتك هي اختيار الترجمة الصحيحة.',
      intro3: 'بعد الإجابة، سيتم تشغيل جملة بسيطة تحتوي على هذا الفعل بالعبرية، مما سيساعدك على تذكر استخدامه ونطقه بشكل أفضل. هذا التمرين يساعدك على توسيع مفرداتك وتحسين مهارات الترجمة والاستماع باللغة العبرية.',
      section: 'الأزرار',
      sound: 'أزرار تشغيل/إيقاف الصوت',
      stat: 'عرض إحصائيات التمرين',
      info: 'وصف التمرين',
      gender: 'اختيار الصوت',
      aiBot: 'روبوت الدردشة الذكي',
      dontShow: 'لا تظهر مرة أخرى'
    },
    am: {
      title: 'ልዩ ምልክት ስለ ልምድ 2',
      intro1: 'በዚህ ልምድ ውስጥ ከተለመዱት የዕብራይስጥ ግሶች 300 የሚጠጋገቡና የሚታወቁን መማረድና መድገም ይችላሉ።',
      intro2: 'የግሱ ነፃ ቅርጽ በአማርኛ ይታያል፣ ከዚህ ጋር አራት የዕብራይስጥ ትርጉም አማራጮች ይሆናሉ። ትክክለኛውን ምርጫ ይምረጡ።',
      intro3: 'ከመምረጥ በኋላ ይህንን ግስ የያዘ ቀላል እና የተድሞም አሰምት ይሰማችኋል። ይህ ልምድ ቃላትን ማሳደግና የትርጉምና የመስማት ችሎታን ማሻሻል ይረዳዎታል።',
      section: 'አዝራሮች',
      sound: 'የድምፅ መቀያየሪያ አዝራሮች',
      stat: 'የልምድ ስታቲስቲክስን ይመልከቱ',
      info: 'የልምድ መግለጫ',
      gender: 'የድምፅ ምርጫ',
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain2, onToggleDontShowAgain }) => {
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
            <View style={[styles.checkbox, dontShowAgain2 && styles.checkboxChecked]}>
              {dontShowAgain2 && <Text style={styles.checkmark}>✓</Text>}
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
