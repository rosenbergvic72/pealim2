import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 1',
    intro1: 'В этом упражнении вы сможете запомнить и повторить около 350 самых употребляемых глаголов иврита.',
    intro2:
      'Вам будет показан и озвучен инфинитив глагола на иврите и четыре варианта его перевода на русский язык. Ваша задача — выбрать правильный перевод.',
    intro3:
      'Это упражнение помогает лучше запомнить употребление глаголов, развить навык быстрого перевода, а также улучшить восприятие речи на слух, что важно для свободного общения на иврите.',

    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    gender: 'Выбор голоса озвучивания',
    aiBot: 'ИИ чатбот',

    cardSection: 'Кнопки карточки глагола',
    eye: 'Исключить глагол: он больше не будет попадаться в новых заданиях (можно вернуть позже).',
    pin: 'Закрепить глагол: он будет встречаться чаще в заданиях (частая ротация).',
    list: 'Открыть список исключённых глаголов: вернуть глагол в задания.',

    close: 'Закрыть',
  },

  en: {
    title: 'TASK DESCRIPTION 1',
    intro1: 'In this exercise, you will memorize and review about 350 of the most frequently used Hebrew verbs.',
    intro2:
      'You will see and hear the infinitive form of a verb in Hebrew and four translation options. Your task is to choose the correct translation.',
    intro3:
      'This exercise helps improve your memory, translation skills, and listening comprehension — essential for fluent Hebrew communication.',

    section: 'Buttons',
    sound: 'Sound on/off buttons',
    stat: 'View exercise statistics',
    info: 'Exercise description',
    gender: 'Voice gender selection',
    aiBot: 'AI Chatbot',

    cardSection: 'Verb card buttons',
    eye: 'Exclude this verb: it will no longer appear in new tasks (you can restore it later).',
    pin: 'Pin this verb: it will appear more often in tasks (frequent rotation).',
    list: 'Open the excluded verbs list: restore a verb back to the tasks.',

    close: 'Close',
  },

  fr: {
    title: 'DESCRIPTION DE L’EXERCICE 1',
    intro1: "Dans cet exercice, vous allez mémoriser et réviser environ 350 verbes hébreux les plus courants.",
    intro2:
      "L'infinitif du verbe en hébreu sera affiché et lu, accompagné de quatre traductions possibles. Votre tâche est de choisir la bonne.",
    intro3:
      'Cet exercice aide à mieux mémoriser les verbes, à développer la traduction rapide et à améliorer la compréhension orale en hébreu.',

    section: 'Boutons',
    sound: 'Boutons activer/désactiver le son',
    stat: "Statistiques de l'exercice",
    info: "Description de l'exercice",
    gender: 'Choix du genre de voix',
    aiBot: 'Chatbot IA',

    cardSection: 'Boutons de la carte du verbe',
    eye: "Exclure ce verbe : il n’apparaîtra plus dans les nouveaux exercices (restauration possible).",
    pin: 'Épingler ce verbe : il apparaîtra plus souvent (rotation fréquente).',
    list: "Ouvrir la liste des verbes exclus : rétablir un verbe dans les exercices.",

    close: 'Fermer',
  },

  es: {
    title: 'DESCRIPCIÓN DEL EJERCICIO 1',
    intro1: 'En este ejercicio, podrás memorizar y repasar unos 350 de los verbos hebreos más utilizados.',
    intro2:
      'Se te mostrará y reproducirá el infinitivo del verbo en hebreo con cuatro opciones de traducción. Debes elegir la correcta.',
    intro3:
      'Este ejercicio mejora la memorización, la traducción rápida y la comprensión auditiva, esenciales para hablar hebreo con fluidez.',

    section: 'Botones',
    sound: 'Botones para activar/desactivar sonido',
    stat: 'Ver estadísticas del ejercicio',
    info: 'Descripción del ejercicio',
    gender: 'Selección de voz (masc/fem)',
    aiBot: 'Chatbot IA',

    cardSection: 'Botones de la tarjeta del verbo',
    eye: 'Excluir este verbo: ya no aparecerá en nuevas tareas (puedes restaurarlo después).',
    pin: 'Fijar este verbo: aparecerá con más frecuencia en las tareas (rotación frecuente).',
    list: 'Abrir la lista de verbos excluidos: devolver un verbo a las tareas.',

    close: 'Cerrar',
  },

  pt: {
    title: 'DESCRIÇÃO DO EXERCÍCIO 1',
    intro1: 'Neste exercício, você vai memorizar e revisar cerca de 350 verbos hebraicos mais comuns.',
    intro2:
      'Será mostrado e reproduzido o infinitivo do verbo em hebraico com quatro opções de tradução. Sua tarefa é escolher a correta.',
    intro3:
      'Este exercício ajuda a memorizar os verbos, desenvolver tradução rápida e melhorar a compreensão auditiva em hebraico.',

    section: 'Botões',
    sound: 'Botões para ligar/desligar som',
    stat: 'Ver estatísticas do exercício',
    info: 'Descrição do exercício',
    gender: 'Selecionar voz (masculino/feminino)',
    aiBot: 'Chatbot IA',

    cardSection: 'Botões do cartão do verbo',
    eye: 'Excluir este verbo: ele não aparecerá mais em novas tarefas (pode ser restaurado depois).',
    pin: 'Fixar este verbo: ele aparecerá com mais frequência (rotação frequente).',
    list: 'Abrir a lista de verbos excluídos: devolver um verbo às tarefas.',

    close: 'Fechar',
  },

  ar: {
    title: 'وَصْف التمرين 1',
    intro1: 'في هذا التمرين، ستتذكر وتراجع حوالي 350 من أكثر الأفعال العبرية استخدامًا.',
    intro2:
      'سيُعرض عليك مصدر الفعل بالعبرية مع تشغيله صوتيًا وأربعة خيارات للترجمة. مهمتك اختيار الترجمة الصحيحة.',
    intro3:
      'يساعد هذا التمرين على حفظ الأفعال، وتطوير مهارة الترجمة السريعة، وتحسين فهم اللغة المنطوقة — وهي أمور ضرورية للتحدث بطلاقة.',

    section: 'الأزرار',
    sound: 'زر تشغيل/إيقاف الصوت',
    stat: 'عرض إحصائيات التمرين',
    info: 'وصف التمرين',
    gender: 'اختيار صوت المتحدث',
    aiBot: 'روبوت الدردشة الذكي',

    cardSection: 'أزرار بطاقة الفعل',
    eye: 'استبعاد هذا الفعل: لن يظهر مجددًا في التمارين الجديدة (يمكن إعادته لاحقًا).',
    pin: 'تثبيت هذا الفعل: سيظهر بشكل أكثر تكرارًا في التمارين (تكرار أعلى).',
    list: 'فتح قائمة الأفعال المستبعدة: إعادة الفعل ليظهر مرة أخرى في التمارين.',

    close: 'إغلاق',
  },

  am: {
    title: 'ልዩ የልምምድ መግለጫ 1',
    intro1: 'በዚህ ልዩ ልምምድ ውስጥ በተለመዱት የሃብሪ ግሶች 350 በቀላሉ መታወቂያ እና መድገሚያ ይደረጋል።',
    intro2:
      'የግስ ማንኛውም ቅድመ-ቅዱስ ቃል በኃብሪኛ ይታያልና ይተረጉማል፤ አራት መረጃዎች ይሰጣሉ። የትኛውን እንደት እንደሚሆን መምረጥ ነው ያለብዎት።',
    intro3:
      'ይህ ልምምድ የግሶችን ማስታወቂያ እና ፈጣን ትርጉም ችሎታ ማሻሻልን እንዲሁም የመሰማት ክህሎት እንዲበረታ ያግዛል።',

    section: 'ቁልፎች',
    sound: 'ድምፅ ማንቃት/ማጥፋት',
    stat: 'የልምምድ ስታቲስቲክስ',
    info: 'የልምምድ መግለጫ',
    gender: 'የድምፅ አምራጭ',
    aiBot: 'የብሔራዊ አይ ቻትቦት',

    cardSection: 'የግስ ካርድ ቁልፎች',
    eye: 'ይህን ግስ አስወግድ፦ ከአዲስ ጥያቄዎች ውስጥ አይታይም (በኋላ መመለስ ይቻላል)።',
    pin: 'ይህን ግስ አጠናክር፦ በጥያቄዎች ውስጥ ብዙ ጊዜ እንዲታይ ያደርጋል (ተደጋጋሚ ሮቴሽን)።',
    list: 'የተወገዱ ግሶች ዝርዝር ክፈት፦ ግሱን ወደ ልምምዶች እንደገና መመለስ።',

    close: 'ዝጋ',
  },
};

const windowHeight = Dimensions.get('window').height;

const languageMap = {
  русский: 'ru',
  english: 'en',
  français: 'fr',
  español: 'es',
  português: 'pt',
  العربية: 'ar',
  አማርኛ: 'am',
};

const TaskDescriptionModal6 = ({ visible, onToggle, language }) => {
  // ✅ важно для iOS: если не показываем — вообще не монтируем
  if (!visible) return null;

  const normalizedInput = (language || '').toLowerCase().trim();
  const langCode = languageMap[normalizedInput] || normalizedInput || 'en';
  const t = translations[langCode] || translations.en;

 // ✅ FULL RETURN (замени целиком return в TaskDescriptionModal6)
return (
  <Modal
    animationType="slide"
    transparent
    visible={!!visible}
    presentationStyle="overFullScreen"
    statusBarTranslucent
    onRequestClose={onToggle}
  >
    {/* ✅ ВАЖНО: фон и контент НЕ в одном Pressable */}
    <View style={styles.backdrop}>
      {/* Фон — закрывает модалку по тапу, но НЕ мешает скроллу */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onToggle} />

      {/* Контент */}
      <FadeInView style={styles.modalView}>
        {/* Header (без крестика) */}
        <View style={styles.header}>
          <Image source={require('./VERBIFY.png')} style={styles.logo} />
        </View>

        {/* ✅ Scroll */}
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>
            {t.title}
          </Text>

          <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            {t.intro1}
          </Text>

          <Text style={[styles.modalText, styles.highlightText]} maxFontSizeMultiplier={1.2}>
            {'\n'}
            {t.intro2}
          </Text>

          <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            {t.intro3}
          </Text>

          {/* Top buttons */}
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
            {t.section}
          </Text>

          <View style={styles.screenshotWrapper}>
            <Image source={require('./scr11.jpg')} style={styles.screenshot} />
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./SoundOn.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.sound}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./stat.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.stat}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./question.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.info}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./GenderMan.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.gender}
            </Text>
          </View>

          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.aiIconRow}>
              <Image source={require('./AI2.png')} style={styles.aiIcon} />
              <Text style={[styles.iconText, { flex: 0 }]} maxFontSizeMultiplier={1.2}>
                {t.aiBot}
              </Text>
            </View>
          </View>

          {/* Verb card buttons */}
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
            {t.cardSection}
          </Text>

          <View style={styles.screenshotWrapper}>
            <Image source={require('./scr21.jpg')} style={styles.screenshot} />
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./glaz2.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.eye}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./gant2.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.pin}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./spisok.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.list}
            </Text>
          </View>

          {/* чуть воздуха перед кнопкой */}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ✅ Bottom Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onToggle} activeOpacity={0.85}>
          <Text style={styles.closeBtnText} maxFontSizeMultiplier={1.2}>
            {t.close}
          </Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  </Modal>
);

};

// ✅ FULL STYLES (замени целиком styles)
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  modalView: {
    width: '92%',
    height: windowHeight * 0.88,
    backgroundColor: '#d6d6d6ff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  header: {
    width: '100%',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },

  logo: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
  },

  // ✅ критично: ScrollView должен занимать место (flex:1)
  scrollWrapper: {
    width: '100%',
    flex: 1,
    marginTop: 4,
  },

  scrollContent: {
    alignItems: 'center',
    paddingBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  modalText: {
    fontSize: 15,
    textAlign: 'center',
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
    marginBottom: 10,
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

  // Bottom close button
  closeBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E0ECFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4880b4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },

  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#17457D',
  },
});


export default TaskDescriptionModal6;
