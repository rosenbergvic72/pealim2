import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 8',  
    intro1: 'Это продвинутое упражнение, предназначенное для тех, кто уже успешно справляется с заданиями в упражнениях 5 и 6. Оно аналогично упражнению 6, но теперь в течение одного раунда необходимо спрягать не один глагол, а случайно выбранные глаголы из всей базы.',
    intro2: 'В каждом раунде случайным образом выбираются глаголы в одной из глагольных форм на иврите. Ваша задача — выбрать правильный перевод на выбранном языке из 6 предложенных вариантов.',
    intro3: 'Это упражнение предназначено для продвинутых учеников, хорошо знакомых со спряжением глаголов в иврите. Оно помогает развить автоматизм, улучшить скорость восприятия и подбора правильных форм, а также глубже понять закономерности спряжения в различных биньянах. Регулярное выполнение упражнения способствует глубокому усвоению системы спряжения глаголов, повышает уверенность в использовании ивритских глаголов и значительно улучшает грамматическую интуицию.', 
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    aiBot: 'ИИ чатбот', 
    dontShow: 'Больше не показывать'
  },
  en: {
  title: 'TASK 8 DESCRIPTION',
  intro1: 'This is an advanced exercise designed for those who have already mastered Exercises 5 and 6. It is similar to Exercise 6, but instead of one verb per round, you will conjugate randomly selected verbs from the entire database.',
  intro2: 'In each round, verbs in one of the conjugated Hebrew forms will be randomly selected. Your task is to choose the correct translation in the selected language from 6 given options.',
  intro3: 'This exercise is intended for advanced learners who are familiar with Hebrew verb conjugation. It helps develop automation, improve recognition speed, and deepen understanding of conjugation patterns across different binyanim. Regular practice reinforces mastery of verb conjugation, boosts confidence in using Hebrew verbs, and significantly enhances grammatical intuition.',
  section: 'Buttons',
  sound: 'Sound on/off buttons',
  stat: 'View exercise statistics',
  info: 'Exercise description',
  aiBot: 'AI chatbot',
  dontShow: 'Do not show again'
},

  
  fr: {
  title: 'DESCRIPTION DE L’EXERCICE 8',
  intro1: 'C’est un exercice avancé destiné à ceux qui maîtrisent déjà les exercices 5 et 6. Il est similaire à l’exercice 6, mais ici, plusieurs verbes aléatoires sont utilisés à chaque tour.',
  intro2: 'À chaque tour, des formes conjuguées en hébreu de différents verbes sont choisies au hasard. Votre tâche est de choisir la bonne traduction dans la langue sélectionnée parmi 6 options proposées.',
  intro3: 'Cet exercice s’adresse aux apprenants avancés qui connaissent bien la conjugaison des verbes hébreux. Il aide à automatiser les réponses, à améliorer la vitesse de reconnaissance et à approfondir la compréhension des modèles de conjugaison. Une pratique régulière renforce la maîtrise, augmente la confiance et améliore fortement l’intuition grammaticale.',
  section: 'Boutons',
  sound: 'Boutons d’activation/désactivation du son',
  stat: 'Voir les statistiques de l’exercice',
  info: 'Description de l’exercice',
  aiBot: 'Chatbot IA',
  dontShow: 'Ne plus afficher'
},

  
  es: {
  title: 'DESCRIPCIÓN DEL EJERCICIO 8',
  intro1: 'Este es un ejercicio avanzado destinado a quienes ya dominan los ejercicios 5 y 6. Es similar al ejercicio 6, pero en lugar de un solo verbo, se utilizan varios verbos seleccionados aleatoriamente de toda la base de datos.',
  intro2: 'En cada ronda se seleccionan aleatoriamente formas verbales en hebreo de diferentes verbos. Tu tarea es elegir la traducción correcta en el idioma seleccionado entre 6 opciones.',
  intro3: 'Este ejercicio está dirigido a estudiantes avanzados familiarizados con la conjugación de verbos en hebreo. Ayuda a desarrollar automatismo, mejorar la velocidad de reconocimiento y profundizar en los patrones de conjugación. La práctica regular fortalece el dominio del sistema, aumenta la confianza y mejora significativamente la intuición gramatical.',
  section: 'Botones',
  sound: 'Botones de sonido',
  stat: 'Ver estadísticas del ejercicio',
  info: 'Descripción del ejercicio',
  aiBot: 'Chatbot con IA',
  dontShow: 'No mostrar de nuevo'
},

  
  pt: {
  title: 'DESCRIÇÃO DO EXERCÍCIO 8',
  intro1: 'Este é um exercício avançado, destinado a quem já domina os exercícios 5 e 6. É semelhante ao exercício 6, mas agora são usados vários verbos aleatórios da base de dados em cada rodada.',
  intro2: 'Em cada rodada, são selecionadas formas conjugadas em hebraico de verbos aleatórios. Sua tarefa é escolher a tradução correta no idioma selecionado entre 6 opções.',
  intro3: 'Este exercício é indicado para estudantes avançados que já conhecem bem a conjugação dos verbos em hebraico. Ele ajuda a desenvolver automatismo, melhorar a velocidade de reconhecimento e aprofundar o entendimento dos padrões de conjugação. A prática constante fortalece o domínio do sistema verbal, aumenta a confiança e melhora significativamente a intuição gramatical.',
  section: 'Botões',
  sound: 'Botões de som',
  stat: 'Ver estatísticas do exercício',
  info: 'Descrição do exercício',
  aiBot: 'Chatbot IA',
  dontShow: 'Não mostrar novamente'
},

  
  ar: {
  title: 'وَصف التمرين 8',
  intro1: 'هذا تمرين متقدم مخصص لأولئك الذين أتموا بنجاح التمرينين 5 و6. وهو مشابه للتمرين 6، ولكن يتم استخدام أفعال عشوائية متعددة من قاعدة البيانات في كل جولة.',
  intro2: 'في كل جولة، يتم اختيار أفعال بصيغة معينة من صيغ التصريف العبري بشكل عشوائي. مهمتك هي اختيار الترجمة الصحيحة من بين 6 خيارات باللغة المحددة.',
  intro3: 'هذا التمرين مخصص للمتعلمين المتقدمين الذين لديهم معرفة جيدة بتصريف الأفعال في اللغة العبرية. يساعد على تطوير التلقائية، وتحسين سرعة التعرف على الصيغ، وتعميق فهم أنماط التصريف. الممارسة المنتظمة تعزز الإتقان، وتزيد من الثقة، وتحسن الحدس النحوي بشكل كبير.',
  section: 'الأزرار',
  sound: 'أزرار تشغيل/إيقاف الصوت',
  stat: 'عرض إحصائيات التمرين',
  info: 'وصف التمرين',
  aiBot: 'روبوت الدردشة الذكي',
  dontShow: 'لا تظهر مرة أخرى'
},

  
  am: {
  title: 'ልዩ ምልክት ስለ ልምድ 8',
  intro1: 'ይህ የላቀ ልምድ ሲሆን ለልምዶች 5 እና 6 በተሟላ መንገድ የተረዱ ተማሪዎች ነው። ከልምድ 6 ጋር ተመሳሳይ ነው፣ ነገር ግን አንድ ግስ ሳይሆን አዲስ በተደራሽ መንገድ የተመረጡ ግሶች ይታያሉ።',
  intro2: 'በእያንዳንዱ ዙር አንድ የግስ ቅርጽ ያላቸው ግሶች በተደራሽ መንገድ ይመረጣሉ። የተሰጡት 6 አማራጮች ውስጥ እኩል የትክክለኛውን ትርጉም ይምረጡ።',
  intro3: 'ይህ ልምድ በዕብራይስጥ ግሶች ሰዋሰው የበለጠ እውቀት ላላቸው ተማሪዎች ይመረጣል። በደንብ ማድረግ የሚረዳው አስተማማኝነትን፣ የማወቅ ፍጥነትንና በበለጠ ጥልቀት የሚታወቀውን ሥነ-ሰዋሰው ያደጋል።',
  section: 'አዝራሮች',
  sound: 'የድምፅ መቀያየሪያ አዝራሮች',
  stat: 'የልምድ ስታቲስቲክስን ይመልከቱ',
  info: 'የልምድ መግለጫ',
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain7, onToggleDontShowAgain }) => {
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
              <Image source={require('./scr3.jpg')} style={styles.screenshot} />
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
            {/* <View style={styles.iconRow}>
              <Image source={require('./GenderMan.png')} style={styles.icon} />
              <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>{t.gender}</Text>
            </View> */}
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={styles.aiIconRow}>
                <Image source={require('./AI2.png')} style={styles.aiIcon} />
                <Text style={[styles.iconText, { flex: 0 }]} maxFontSizeMultiplier={1.2}>{t.aiBot}</Text>
              </View>
            </View>
          </ScrollView>
          {/* Фиксированный чекбокс вне скролла */}
          <TouchableOpacity style={styles.dontShowRow} onPress={onToggleDontShowAgain} activeOpacity={0.7}>
            <View style={[styles.checkbox, dontShowAgain7 && styles.checkboxChecked]}>
              {dontShowAgain7 && <Text style={styles.checkmark}>✓</Text>}
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