import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 5', 
    intro1: 'Это основное упражнение в приложении, разработанное для эффективной тренировки спряжения глаголов в иврите.',
    intro2: 'В каждом раунде случайным образом выбирается глагол на иврите, и вам необходимо найти правильную пару для одной из его форм спряжения. Поочередно будут показаны 6 пар из возможных 36 (или 24), содержащие глагольные формы на иврите и их соответствующие варианты на выбранном языке. Ваша задача — правильно сопоставить их, т.е сначала выбрать вариант в столбике слева, а затем соответствующий ему вариант на иврите в столбике справа.',
    intro3: 'Это упражнение рекомендуется тем, кто уже изучает иврит и обладает хотя бы базовыми знаниями о спряжении глаголов. Даже при минимальном понимании темы регулярное выполнение задания поможет вам лучше запомнить формы спряжения, выявить закономерности и закрепить их на практике. Регулярная практика способствует глубокому пониманию системы спряжения глаголов, развитию интуитивного восприятия грамматических закономерностей и улучшению навыков восприятия иврита.', 
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    gender: 'Поиск по базе глаголов упражнения', 
    aiBot: 'ИИ чатбот',
    dontShow: 'Больше не показывать'
  },
  en: {
    title: 'TASK 5 DESCRIPTION',
    intro1: 'This is the main exercise in the app, designed for effective training in Hebrew verb conjugation.',
    intro2: 'In each round, a random Hebrew verb is selected, and you need to find the correct match for one of its conjugated forms. You will be shown 6 pairs out of a possible 36 (or 24), containing Hebrew verb forms and their corresponding options in the selected language. Your task is to match them correctly by selecting the option on the left, then the corresponding form in Hebrew on the right.',
    intro3: 'This exercise is recommended for those who already study Hebrew and have at least basic knowledge of verb conjugation. Even with minimal understanding, regular practice will help you remember the forms, recognize patterns, and reinforce them in practice. It promotes a deeper understanding of the conjugation system, develops intuitive grammar awareness, and improves your Hebrew comprehension.',
    section: 'Buttons',
    sound: 'Sound on/off buttons',
    stat: 'View exercise statistics',
    info: 'Exercise description',
    gender: 'Verb database search for this exercise',
    aiBot: 'AI chatbot',
    dontShow: 'Do not show again'
  },
  
  fr: {
    title: 'DESCRIPTION DE L’EXERCICE 5',
    intro1: 'C’est l’exercice principal de l’application, conçu pour s’entraîner efficacement à la conjugaison des verbes en hébreu.',
    intro2: 'À chaque tour, un verbe hébreu est choisi au hasard. Vous devez retrouver la bonne correspondance pour l’une de ses formes conjuguées. 6 paires vous seront présentées parmi les 36 (ou 24) possibles, avec les formes en hébreu et leurs équivalents dans votre langue. Votre tâche est de les associer correctement, en sélectionnant d’abord l’option à gauche, puis sa correspondance en hébreu à droite.',
    intro3: 'Cet exercice est recommandé aux personnes qui étudient déjà l’hébreu et ont au moins des bases en conjugaison. Même avec peu de connaissances, une pratique régulière permet de mieux mémoriser les formes, de reconnaître les schémas et de les renforcer. Elle favorise une compréhension plus profonde de la conjugaison, une intuition grammaticale et une meilleure compréhension de l’hébreu.',
    section: 'Boutons',
    sound: 'Boutons d’activation/désactivation du son',
    stat: 'Voir les statistiques de l’exercice',
    info: 'Description de l’exercice',
    gender: 'Recherche dans la base de verbes de l’exercice',
    aiBot: 'Chatbot IA',
    dontShow: 'Ne plus afficher'
  },
  
  es: {
    title: 'DESCRIPCIÓN DEL EJERCICIO 5',
    intro1: 'Este es el ejercicio principal de la aplicación, diseñado para entrenar eficazmente la conjugación de verbos en hebreo.',
    intro2: 'En cada ronda se elige aleatoriamente un verbo en hebreo, y debes encontrar la pareja correcta para una de sus formas conjugadas. Se mostrarán 6 pares de entre 36 (o 24) posibles, que contienen formas verbales en hebreo y sus equivalentes en el idioma seleccionado. Tu tarea es emparejarlos correctamente, eligiendo primero una opción en la columna izquierda y luego su correspondencia en hebreo en la columna derecha.',
    intro3: 'Este ejercicio se recomienda a quienes ya estudian hebreo y tienen al menos conocimientos básicos sobre conjugaciones. Incluso con una comprensión mínima, la práctica regular ayuda a memorizar las formas, identificar patrones y reforzarlos. Fomenta una comprensión profunda del sistema verbal, desarrolla la intuición gramatical y mejora la comprensión del hebreo.',
    section: 'Botones',
    sound: 'Botones de sonido',
    stat: 'Ver estadísticas del ejercicio',
    info: 'Descripción del ejercicio',
    gender: 'Búsqueda en la base de datos de verbos del ejercicio',
    aiBot: 'Chatbot con IA',
    dontShow: 'No mostrar de nuevo'
  },
  
  pt: {
    title: 'DESCRIÇÃO DO EXERCÍCIO 5',
    intro1: 'Este é o exercício principal do aplicativo, criado para treinar efetivamente a conjugação de verbos em hebraico.',
    intro2: 'Em cada rodada, um verbo em hebraico é escolhido aleatoriamente e você deve encontrar o par correto para uma de suas formas conjugadas. Serão exibidos 6 pares entre os 36 (ou 24) possíveis, contendo formas verbais em hebraico e suas correspondências no idioma escolhido. Sua tarefa é fazer a correspondência correta: primeiro selecione a opção à esquerda, depois a correspondente em hebraico à direita.',
    intro3: 'Este exercício é recomendado para quem já estuda hebraico e tem ao menos conhecimentos básicos sobre conjugação. Mesmo com pouco conhecimento, a prática regular ajuda a memorizar as formas, identificar padrões e consolidá-los. Ela favorece uma compreensão profunda da conjugação verbal, desenvolve a intuição gramatical e melhora a compreensão do hebraico.',
    section: 'Botões',
    sound: 'Botões de som',
    stat: 'Ver estatísticas do exercício',
    info: 'Descrição do exercício',
    gender: 'Busca na base de dados de verbos',
    aiBot: 'Chatbot IA',
    dontShow: 'Não mostrar novamente'
  },
  
  ar: {
    title: 'وَصف التمرين 5',
    intro1: 'هذا هو التمرين الرئيسي في التطبيق، وقد صُمم لتدريب فعال على تصريف الأفعال في اللغة العبرية.',
    intro2: 'في كل جولة، يتم اختيار فعل عبري عشوائيًا، ويجب عليك إيجاد المطابقة الصحيحة لإحدى صيغه. سيتم عرض 6 أزواج من أصل 36 (أو 24)، تحتوي على صيغ عبرية وخيارات مقابلة باللغة المحددة. مهمتك هي مطابقتها بشكل صحيح، أي اختيار العنصر في العمود الأيسر، ثم نظيره العبري في العمود الأيمن.',
    intro3: 'يوصى بهذا التمرين لمن يدرسون اللغة العبرية ولديهم معرفة أساسية بتصريف الأفعال. حتى مع القليل من الفهم، فإن التمرين المنتظم سيساعدك على تذكر الصيغ، واكتشاف الأنماط، وتعزيزها. إنه يعزز الفهم العميق للتصريف، ويطور الإدراك الغريزي للقواعد، ويحسن فهم العبرية.',
    section: 'الأزرار',
    sound: 'أزرار تشغيل/إيقاف الصوت',
    stat: 'عرض إحصائيات التمرين',
    info: 'وصف التمرين',
    gender: 'البحث في قاعدة بيانات الأفعال',
    aiBot: 'روبوت الدردشة الذكي',
    dontShow: 'لا تظهر مرة أخرى'
  },
  
  am: {
    title: 'ልዩ ምልክት ስለ ልምድ 5',
    intro1: 'ይህ በመተግበሪያው ውስጥ ዋናው ልምድ ነው፣ ለዕብራይስጥ ግስ ሰዋሰው ልምምድ በተሟላ መንገድ የተዘጋጀ።',
    intro2: 'በእያንዳንዱ ዙር፣ አንድ የዕብራይስጥ ግስ የማይታወቀው በመምረጥ ይታያል፣ እና ከዚህ ጋር ከሰዋሰው ቅርጾቹ አንዱ ጋር መጣጣም የሚችል እኩል መፈለግ ይኖርብዎታል። ከ36 (ወይም 24) ውስጥ 6 ጥናቶች ይታያሉ፣ በእያንዳንዱ ጊዜ የዕብራይስጥ ቅርጾችና ትርጉሞቻቸው ይቀርባሉ።',
    intro3: 'ይህ ልምድ ከዚህ በፊት ንዑስ የእውቀት ያላቸውን የዕብራይስጥ ተማሪዎች ይመረጣል። በትንሽ እውቀት ቢሆንም፣ በደንብ ማድረግ ሰዋሰው ቅርጾችን ማስታወስ፣ ደጋግመኛ አቀማመጦችን መረዳት እና እነሱን ማጠናከር ይቻላል።',
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain6, onToggleDontShowAgain }) => {
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
            <View style={[styles.checkbox, dontShowAgain6 && styles.checkboxChecked]}>
              {dontShowAgain6 && <Text style={styles.checkmark}>✓</Text>}
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
