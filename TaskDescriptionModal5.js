import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 4', 
    intro1: 'В этом упражнении вам будет показана команда или просьба, выраженная глаголом в повелительном наклонении (императиве), а также изображение человека или группы людей, которым адресовано указание (мужчина, женщина или группа лиц).',
    intro2: 'Ваша задача — выбрать правильную форму императива на иврите из четырёх предложенных вариантов.',
    intro3: 'Даже если у вас минимальные знания этой темы, регулярное выполнение упражнения поможет вам самостоятельно выявить закономерности образования императивов в иврите. Такой метод тренировки способствует быстрому запоминанию правильных форм, развитию интуитивного понимания грамматики и улучшению навыков восприятия языка на практике.',
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    aiBot: 'ИИ чатбот', 
    dontShow: 'Больше не показывать'
  },
  en: {
    title: 'TASK 4 DESCRIPTION',
    intro1: 'In this exercise, you will be shown a command or request expressed in the imperative form, along with an image of the person or group being addressed (a man, a woman, or a group).',
    intro2: 'Your task is to choose the correct imperative form in Hebrew from the four given options.',
    intro3: 'Even if you have minimal knowledge of this topic, regularly doing this exercise will help you identify the patterns of forming Hebrew imperatives. This type of training promotes quick memorization of correct forms, intuitive understanding of grammar, and improved practical language skills.',
    section: 'Buttons',
    sound: 'Sound on/off buttons',
    stat: 'View exercise statistics',
    info: 'Exercise description',
    aiBot: 'AI chatbot',
    dontShow: 'Do not show again'
  },
  
  fr: {
    title: 'DESCRIPTION DE L’EXERCICE 4',
    intro1: 'Dans cet exercice, une commande ou une demande exprimée à l’impératif vous sera présentée, accompagnée d’une image montrant à qui elle s’adresse (homme, femme ou groupe).',
    intro2: 'Votre tâche est de choisir la bonne forme de l’impératif en hébreu parmi les quatre options proposées.',
    intro3: 'Même avec peu de connaissances sur ce sujet, pratiquer régulièrement cet exercice vous aidera à reconnaître les schémas de formation de l’impératif en hébreu. Cette méthode favorise la mémorisation rapide des formes correctes, une compréhension intuitive de la grammaire et une meilleure maîtrise pratique de la langue.',
    section: 'Boutons',
    sound: 'Boutons d’activation/désactivation du son',
    stat: 'Voir les statistiques de l’exercice',
    info: 'Description de l’exercice',
    aiBot: 'Chatbot IA',
    dontShow: 'Ne plus afficher'
  },
  
  es: {
    title: 'DESCRIPCIÓN DEL EJERCICIO 4',
    intro1: 'En este ejercicio se te mostrará una orden o petición en forma imperativa, junto con una imagen de la persona o grupo al que va dirigida (hombre, mujer o grupo).',
    intro2: 'Tu tarea es elegir la forma correcta del imperativo en hebreo entre las cuatro opciones propuestas.',
    intro3: 'Aunque tengas pocos conocimientos sobre el tema, la práctica regular de este ejercicio te ayudará a reconocer los patrones de formación del imperativo en hebreo. Este método facilita la memorización rápida, la comprensión intuitiva de la gramática y mejora las habilidades prácticas del idioma.',
    section: 'Botones',
    sound: 'Botones de sonido',
    stat: 'Ver estadísticas del ejercicio',
    info: 'Descripción del ejercicio',
    aiBot: 'Chatbot con IA',
    dontShow: 'No mostrar de nuevo'
  },
  
  pt: {
    title: 'DESCRIÇÃO DO EXERCÍCIO 4',
    intro1: 'Neste exercício, você verá uma ordem ou pedido no modo imperativo, juntamente com a imagem da pessoa ou grupo a quem se dirige (homem, mulher ou grupo).',
    intro2: 'Sua tarefa é escolher a forma correta do imperativo em hebraico entre as quatro opções apresentadas.',
    intro3: 'Mesmo com conhecimentos mínimos sobre o tema, a prática regular deste exercício ajudará você a identificar os padrões de formação do imperativo em hebraico. Esse método favorece a memorização rápida, o entendimento intuitivo da gramática e a melhora nas habilidades práticas do idioma.',
    section: 'Botões',
    sound: 'Botões de som',
    stat: 'Ver estatísticas do exercício',
    info: 'Descrição do exercício',
    aiBot: 'Chatbot IA',
    dontShow: 'Não mostrar novamente'
  },
  
  ar: {
    title: 'وَصف التمرين 4',
    intro1: 'في هذا التمرين، سيتم عرض أمر أو طلب بصيغة الأمر، مع صورة توضح الشخص أو المجموعة الموجه إليها (رجل، امرأة أو مجموعة).',
    intro2: 'مهمتك هي اختيار الصيغة الصحيحة للأمر باللغة العبرية من بين أربع خيارات.',
    intro3: 'حتى لو كانت لديك معرفة محدودة بهذا الموضوع، فإن الممارسة المنتظمة لهذا التمرين ستساعدك على التعرف على أنماط بناء الأمر في العبرية. هذا الأسلوب يعزز سرعة الحفظ، والفهم التلقائي للقواعد، وتحسين المهارات اللغوية العملية.',
    section: 'الأزرار',
    sound: 'أزرار تشغيل/إيقاف الصوت',
    stat: 'عرض إحصائيات التمرين',
    info: 'وصف التمرين',
    aiBot: 'روبوت الدردشة الذكي',
    dontShow: 'لا تظهر مرة أخرى'
  },
  
  am: {
    title: 'ልዩ ምልክት ስለ ልምድ 4',
    intro1: 'በዚህ ልምድ ውስጥ የተሰጠ ትእዛዝ ወይም ጥያቄ በአዝዣዊ ቅርጽ ይታያል፣ ከዚያም ለሚታየው ሰው (ወንድ፣ ሴት ወይም ቡድን) ተምሳሌት ይኖራል።',
    intro2: 'ከተቀመጡት አራት አማራጮች ውስጥ ትክክለኛውን የአዝዣዊ ቅርጽ በዕብራይስጥ ይምረጡ።',
    intro3: 'በዚህ ርዕስ ዙሪያ የሚኖራችሁ አነስተኛ እውቀት ቢሆንም፣ ይህን ልምድ በመደገፍ መስራት የአዝዣዊ ቅርጾችን የተደጋጋሚ አቀማመጥ ማወቅ ይቻላል። ይህ ዘዴ ትክክለኛ ቅርጾችን በፍጥነት ማስታወስ፣ ሕጋዊነትን በተፈጥሮ መረዳትና የቋንቋ ችሎታዎን በተለዋዋጭ መንገድ ማሻሻል ይረዳዎታል።',
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain5, onToggleDontShowAgain }) => {
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
            <View style={[styles.checkbox, dontShowAgain5 && styles.checkboxChecked]}>
              {dontShowAgain5 && <Text style={styles.checkmark}>✓</Text>}
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
