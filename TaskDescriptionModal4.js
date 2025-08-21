import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 7',  
    intro1: 'Это продвинутое упражнение, предназначенное для тех, кто уже успешно справляется с заданиями в упражнениях 5 и 6. Оно аналогично упражнению 5, но теперь в течение одного раунда необходимо спрягать не один глагол, а случайно выбранные глаголы из всей базы.',
    intro2: 'В каждом раунде поочередно будут показаны 6 пар из всех возможных глагольных форм. Ваша задача — правильно сопоставить эти формы на иврите с их соответствующими вариантами на выбранном языке. Как и в упражнении 5, сначала выбирается вариант в столбике слева, а затем его соответствие в столбике справа.', 
    intro3: 'Это упражнение предназначено для продвинутых учеников, хорошо знакомых со спряжением глаголов в иврите. Оно помогает развить автоматизм, улучшить скорость восприятия и подбора правильных форм, а также глубже понять закономерности спряжения в различных биньянах. Регулярное выполнение упражнения способствует глубокому усвоению системы спряжения глаголов, повышает уверенность в использовании ивритских глаголов и значительно улучшает грамматическую интуицию.', 
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    aiBot: 'ИИ чатбот', 
    dontShow: 'Больше не показывать'
  },
  en: {
  title: 'TASK 7 DESCRIPTION',
  intro1: 'This is an advanced exercise intended for those who have successfully completed Exercises 5 and 6. It is similar to Exercise 5, but instead of conjugating one verb per round, you will conjugate randomly selected verbs from the entire database.',
  intro2: 'In each round, 6 pairs of verb forms will be shown. Your task is to correctly match the Hebrew verb forms with their corresponding translations in the selected language. As in Exercise 5, you first select a variant in the left column, then its match on the right.',
  intro3: 'This exercise is designed for advanced learners who are already familiar with Hebrew verb conjugation. It helps develop automation, improve recognition speed, and deepen understanding of conjugation patterns across different binyanim. Regular practice with this task strengthens mastery of the verb system, increases confidence in using Hebrew verbs, and greatly enhances grammatical intuition.',
  section: 'Buttons',
  sound: 'Sound on/off buttons',
  stat: 'View exercise statistics',
  info: 'Exercise description',
  aiBot: 'AI chatbot',
  dontShow: 'Do not show again'
},

  
  fr: {
  title: 'DESCRIPTION DE L’EXERCICE 7',
  intro1: 'C’est un exercice avancé destiné à ceux qui réussissent déjà les exercices 5 et 6. Il est similaire à l’exercice 5, mais ici, plusieurs verbes aléatoires sont conjugués dans un même tour.',
  intro2: 'À chaque tour, vous verrez 6 paires de formes verbales. Votre tâche est d’associer correctement les formes en hébreu avec leurs traductions dans la langue choisie. Comme dans l’exercice 5, vous sélectionnez d’abord une option dans la colonne de gauche, puis sa correspondance dans celle de droite.',
  intro3: 'Cet exercice s’adresse aux apprenants avancés qui maîtrisent déjà la conjugaison des verbes hébreux. Il aide à automatiser les réponses, à améliorer la rapidité de reconnaissance et à approfondir la compréhension des modèles de conjugaison dans différents binyanim. Une pratique régulière renforce la maîtrise des conjugaisons, accroît la confiance en soi et améliore fortement l’intuition grammaticale.',
  section: 'Boutons',
  sound: 'Boutons d’activation/désactivation du son',
  stat: 'Voir les statistiques de l’exercice',
  info: 'Description de l’exercice',
  aiBot: 'Chatbot IA',
  dontShow: 'Ne plus afficher'
},

  
  es: {
  title: 'DESCRIPCIÓN DEL EJERCICIO 7',
  intro1: 'Este es un ejercicio avanzado destinado a quienes ya dominan los ejercicios 5 y 6. Es similar al ejercicio 5, pero en lugar de conjugar un solo verbo, se presentan varios verbos seleccionados aleatoriamente de toda la base de datos.',
  intro2: 'En cada ronda se muestran 6 pares de formas verbales. Tu tarea es emparejar correctamente las formas en hebreo con sus traducciones en el idioma seleccionado. Como en el ejercicio 5, primero eliges una opción en la columna izquierda y luego su correspondencia en la derecha.',
  intro3: 'Este ejercicio está diseñado para estudiantes avanzados que ya están familiarizados con la conjugación de verbos en hebreo. Ayuda a desarrollar automatización, mejorar la velocidad de reconocimiento y profundizar en los patrones de conjugación en los diferentes binyanim. La práctica constante fortalece el dominio del sistema verbal, aumenta la confianza en el uso del hebreo y mejora notablemente la intuición gramatical.',
  section: 'Botones',
  sound: 'Botones de sonido',
  stat: 'Ver estadísticas del ejercicio',
  info: 'Descripción del ejercicio',
  aiBot: 'Chatbot con IA',
  dontShow: 'No mostrar de nuevo'
},

  
  pt: {
  title: 'DESCRIÇÃO DO EXERCÍCIO 7',
  intro1: 'Este é um exercício avançado, destinado àqueles que já dominaram os exercícios 5 e 6. É semelhante ao exercício 5, mas agora, em cada rodada, serão usados verbos aleatórios de todo o banco de dados.',
  intro2: 'Em cada rodada, serão exibidos 6 pares de formas verbais. Sua tarefa é combinar corretamente as formas em hebraico com suas traduções no idioma selecionado. Assim como no exercício 5, você primeiro seleciona uma opção na coluna esquerda e depois a correspondente na coluna direita.',
  intro3: 'Este exercício é recomendado para alunos avançados que já conhecem bem a conjugação de verbos em hebraico. Ele ajuda a desenvolver automatismo, aumentar a velocidade de reconhecimento e aprofundar a compreensão dos padrões de conjugação nos diferentes binyanim. A prática regular fortalece o domínio da conjugação, aumenta a confiança e melhora muito a intuição gramatical.',
  section: 'Botões',
  sound: 'Botões de som',
  stat: 'Ver estatísticas do exercício',
  info: 'Descrição do exercício',
  aiBot: 'Chatbot IA',
  dontShow: 'Não mostrar novamente'
},

  
  ar: {
  title: 'وَصف التمرين 7',
  intro1: 'هذا تمرين متقدم مخصص لأولئك الذين أتموا التمارين 5 و6 بنجاح. وهو مشابه للتمرين 5، ولكن بدلاً من تصريف فعل واحد في الجولة، يتم اختيار عدة أفعال عشوائيًا من قاعدة البيانات.',
  intro2: 'في كل جولة، ستُعرض 6 أزواج من صيغ الأفعال. مهمتك هي مطابقة الصيغ العبرية مع ترجماتها باللغة المختارة. كما في التمرين 5، تختار أولاً من العمود الأيسر ثم المطابقة من العمود الأيمن.',
  intro3: 'هذا التمرين مخصص للمتعلمين المتقدمين الذين لديهم معرفة جيدة بتصريف الأفعال في العبرية. يساعد على تطوير التلقائية، وتحسين سرعة الفهم، وتعميق معرفة أنماط التصريف عبر البنيانيم المختلفة. الممارسة المنتظمة تساهم في ترسيخ النظام، وزيادة الثقة، وتحسين الحدس النحوي.',
  section: 'الأزرار',
  sound: 'أزرار تشغيل/إيقاف الصوت',
  stat: 'عرض إحصائيات التمرين',
  info: 'وصف التمرين',
  aiBot: 'روبوت الدردشة الذكي',
  dontShow: 'لا تظهر مرة أخرى'
},

  
  am: {
  title: 'ልዩ ምልክት ስለ ልምድ 7',
  intro1: 'ይህ የላቀ ልምድ ሲሆን ልምዶች 5 እና 6 እንደሚሰሩ የተረዱ ተማሪዎች ለሚመሩ ነው። ከልምድ 5 ጋር ተመሳሳይ ነው፣ ግን በአንድ ዙር ላይ አንድ ግስ ሳይሆን ከመረጠ የግሶች መረጃ ቋት የተወሰኑ ግሶች ይታያሉ።',
  intro2: 'በእያንዳንዱ ዙር 6 የተጣጣመ የግስ ቅርጾች ይታያሉ። እባኮትን ቅርጾቹን በዕብራይስጥ ከተሰጡት ትርጉሞች ጋር እንደተሟሉ ይዛመዱ። ከልምድ 5 ጋር ተመሳሳይ ሆኖ፣ መጀመሪያ ከግራ ተለዋዋጭ ተመርጧል ከዚያ ከቀኝ መስተዋት ነው።',
  intro3: 'ይህ ልምድ በዕብራይስጥ ግሶች ሰዋሰው ዝቅተኛ የማይሆን እውቀት ላላቸው ተማሪዎች ይመረጣል። እንደ ልምድ እንዲቆይ እና በቀጣይነት ይሰራ ብለን እንደ ሕይወት መረዳት፣ ማሳወቂያ እና የሥነ-ሰዋሰው ሕሳብ እንዲጠናከር ያደርገዋል።',
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

const TaskDescriptionModal6 = ({ visible, onToggle, language, dontShowAgain4, onToggleDontShowAgain }) => {
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
            <View style={[styles.checkbox, dontShowAgain4 && styles.checkboxChecked]}>
              {dontShowAgain4 && <Text style={styles.checkmark}>✓</Text>}
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