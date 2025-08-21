import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
 ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 6',  
    intro1: 'Это упражнение аналогично упражнению 5, также является основным в приложении и разработано для эффективной тренировки спряжения глаголов в иврите.',
    intro2:'В каждом раунде случайным образом выбирается глагол на иврите, и вам необходимо найти правильную пару для одной из его форм спряжения. Поочередно будут показаны 36 (или 24) глагольных форм на иврите, и ваша задача — выбрать правильный перевод на выбранном языке из 6 предложенных вариантов.',
    intro3: 'Это упражнение рекомендуется тем, кто уже изучает иврит и обладает хотя бы базовыми знаниями о спряжении глаголов. Даже при минимальном понимании темы регулярная практика поможет вам лучше запомнить формы спряжения, выявить закономерности и закрепить их на практике. Постоянные тренировки способствуют более глубокому пониманию системы спряжения глаголов, развитию интуитивного восприятия грамматических закономерностей и улучшению навыков восприятия иврита.',  
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    gender: 'Поиск по базе глаголов упражнения', 
    aiBot: 'ИИ чатбот',
    dontShow: 'Больше не показывать'
  },
  en: {
  title: 'TASK 6 DESCRIPTION',
  intro1: 'This exercise is similar to Exercise 5 and is also one of the main ones in the app, designed for effective practice of Hebrew verb conjugation.',
  intro2: 'In each round, a random Hebrew verb is selected, and you need to find the correct match for one of its conjugated forms. You will be shown 36 (or 24) verb forms in Hebrew, and your task is to choose the correct translation in the selected language from 6 given options.',
  intro3: 'This exercise is recommended for learners who already study Hebrew and have at least a basic understanding of verb conjugation. Even with minimal knowledge, regular practice will help you better memorize the forms, recognize patterns, and reinforce them through use. Frequent training promotes a deeper understanding of the conjugation system, development of intuitive grammar perception, and improved Hebrew comprehension skills.',
  section: 'Buttons',
  sound: 'Sound on/off buttons',
  stat: 'View exercise statistics',
  info: 'Exercise description',
  gender: 'Verb database search for this exercise',
  aiBot: 'AI chatbot',
  dontShow: 'Do not show again'
},

  
  fr: {
  title: 'DESCRIPTION DE L’EXERCICE 6',
  intro1: 'Cet exercice est similaire à l’exercice 5 et fait aussi partie des principaux entraînements de l’application, conçu pour pratiquer efficacement la conjugaison des verbes en hébreu.',
  intro2: 'À chaque tour, un verbe hébreu est choisi au hasard, et vous devez retrouver la bonne correspondance pour l’une de ses formes conjuguées. Vous verrez 36 (ou 24) formes verbales en hébreu, et votre tâche est de choisir la bonne traduction dans la langue sélectionnée parmi 6 options proposées.',
  intro3: 'Cet exercice est recommandé à ceux qui étudient déjà l’hébreu et ont des bases en conjugaison. Même avec peu de connaissances, une pratique régulière vous aidera à mémoriser les formes, identifier les schémas et les consolider. Des entraînements fréquents favorisent une compréhension approfondie de la conjugaison, le développement d’une intuition grammaticale et l’amélioration de la compréhension de l’hébreu.',
  section: 'Boutons',
  sound: 'Boutons d’activation/désactivation du son',
  stat: 'Voir les statistiques de l’exercice',
  info: 'Description de l’exercice',
  gender: 'Recherche dans la base de verbes de l’exercice',
  aiBot: 'Chatbot IA',
  dontShow: 'Ne plus afficher'
},

  
  es: {
  title: 'DESCRIPCIÓN DEL EJERCICIO 6',
  intro1: 'Este ejercicio es similar al Ejercicio 5 y también es uno de los principales del aplicativo, diseñado para practicar eficazmente la conjugación de verbos en hebreo.',
  intro2: 'En cada ronda se selecciona un verbo hebreo al azar y deberás encontrar su traducción correcta para una de sus formas conjugadas. Verás 36 (o 24) formas verbales en hebreo y tu tarea será elegir la traducción correcta en el idioma seleccionado entre 6 opciones.',
  intro3: 'Este ejercicio está recomendado para quienes ya estudian hebreo y tienen al menos conocimientos básicos sobre conjugación. Incluso con conocimientos mínimos, la práctica constante te ayudará a memorizar las formas, reconocer patrones y reforzarlos. El entrenamiento frecuente favorece una comprensión profunda del sistema de conjugación, el desarrollo de una intuición gramatical y una mejor comprensión del hebreo.',
  section: 'Botones',
  sound: 'Botones para activar/desactivar sonido',
  stat: 'Ver estadísticas del ejercicio',
  info: 'Descripción del ejercicio',
  gender: 'Búsqueda en la base de verbos del ejercicio',
  aiBot: 'Chatbot con IA',
  dontShow: 'No mostrar de nuevo'
},

  
  pt: {
  title: 'DESCRIÇÃO DO EXERCÍCIO 6',
  intro1: 'Este exercício é semelhante ao Exercício 5 e também é um dos principais do aplicativo, criado para treinar a conjugação de verbos em hebraico de forma eficaz.',
  intro2: 'Em cada rodada, um verbo hebraico é escolhido aleatoriamente, e você deverá encontrar a tradução correta para uma das suas formas conjugadas. Serão exibidas 36 (ou 24) formas verbais em hebraico, e sua tarefa é escolher a tradução correta no idioma selecionado entre 6 opções.',
  intro3: 'Este exercício é recomendado para quem já estuda hebraico e tem pelo menos conhecimentos básicos de conjugação verbal. Mesmo com conhecimento mínimo, a prática frequente ajuda na memorização das formas, reconhecimento de padrões e consolidação. Treinamentos constantes promovem uma compreensão mais profunda do sistema de conjugação, desenvolvem intuição gramatical e melhoram a compreensão do hebraico.',
  section: 'Botões',
  sound: 'Botões de som',
  stat: 'Ver estatísticas do exercício',
  info: 'Descrição do exercício',
  gender: 'Busca na base de verbos deste exercício',
  aiBot: 'Chatbot IA',
  dontShow: 'Não mostrar novamente'
},

  
  ar: {
  title: 'وَصف التمرين 6',
  intro1: 'هذا التمرين مشابه للتمرين 5، وهو أيضًا من التمارين الأساسية في التطبيق والمصمم لتدريب فعّال على تصريف الأفعال في العبرية.',
  intro2: 'في كل جولة، يتم اختيار فعل عبري بشكل عشوائي، وعليك إيجاد الترجمة الصحيحة لأحد أشكاله المصرفة. ستُعرض عليك 36 (أو 24) صيغة فعل بالعبرية، ومهمتك اختيار الترجمة الصحيحة باللغة المحددة من بين 6 خيارات.',
  intro3: 'ينصح بهذا التمرين لمن يدرسون اللغة العبرية ويملكون معرفة أساسية بتصريف الأفعال. حتى مع فهم محدود، فإن الممارسة المنتظمة تساعدك على حفظ الصيغ، واكتشاف الأنماط، وترسيخها من خلال التدريب. التمارين المستمرة تعزز الفهم العميق لنظام التصريف، وتنمّي الحدس النحوي، وتحسن من مهارات فهم العبرية.',
  section: 'الأزرار',
  sound: 'أزرار تشغيل/إيقاف الصوت',
  stat: 'عرض إحصائيات التمرين',
  info: 'وصف التمرين',
  gender: 'البحث في قاعدة بيانات الأفعال للتمرين',
  aiBot: 'روبوت الدردشة الذكي',
  dontShow: 'لا تظهر مرة أخرى'
},

  
  am: {
  title: 'ልዩ ምልክት ስለ ልምድ 6',
  intro1: 'ይህ ልምድ ከልምድ 5 ጋር ተመሳሳይ ነው፣ በመተግበሪያውም ዋና ልምድ ነው፣ ለዕብራይስጥ ግሶች ሰዋሰው ልምምድ በተሟላ መንገድ የተሰራ።',
  intro2: 'በእያንዳንዱ ዙር፣ አንድ ግስ በተደራሽ መንገድ ይመረጣል፣ እና የተሰዋሰው አንዱን ቅርጽ ትርጉሙን ከ6 አማራጮች መምረጥ ይኖርብዎታል። 36 (ወይም 24) የግስ ቅርጾች በእብራይስጥ ይታያሉ።',
  intro3: 'ይህ ልምድ ቢያንስ የተሰዋሰውን ቅርጾች የሚያውቁ የዕብራይስጥ ተማሪዎችን ይመረጣል። ዝቅተኛ እውቀት ቢኖርም እንኳን የተደጋጋሚ ልምድ ይረዳዎታል። ይህ ዘዴ ቅርጾችን ማስታወስ፣ ስርዓቱን ማረዳትና የቋንቋ ችሎታን ማሻሻል ይችላል።',
  section: 'አዝራሮች',
  sound: 'የድምፅ መቀያየሪያ አዝራሮች',
  stat: 'የልምድ ስታቲስቲክስን ይመልከቱ',
  info: 'የልምድ መግለጫ',
  gender: 'በግስ መረጃ ቋት ውስጥ ፍለጋ',
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain8, onToggleDontShowAgain }) => {
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
              <Image source={require('./scr2.jpg')} style={styles.screenshot} />
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
              <Image source={require('./search1.png')} style={styles.icon} />
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
            <View style={[styles.checkbox, dontShowAgain8 && styles.checkboxChecked]}>
              {dontShowAgain8 && <Text style={styles.checkmark}>✓</Text>}
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
