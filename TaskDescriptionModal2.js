import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FadeInView from './api/FadeInView';

const translations = {
  ru: {
    title: 'ОПИСАНИЕ ЗАДАНИЯ 2',
    intro1: 'В этом упражнении вы сможете запомнить и повторить около 300 самых употребляемых глаголов иврита.',
    intro2:
      'Вам будет показан инфинитив глагола на русском языке, а также четыре варианта его перевода на иврит. Ваша задача — выбрать правильный вариант.',
    intro3:
      'После ответа вам будет предложено простое озвученное предложение с этим глаголом на иврите, что поможет лучше запомнить его использование и произношение. Это упражнение способствует расширению словарного запаса, улучшению навыков перевода и восприятия ивритской речи на слух.',
    section: 'Кнопки',
    sound: 'Кнопки включения и отключения звука',
    stat: 'Просмотр статистики упражнения',
    info: 'Описание упражнения',
    gender: 'Выбор голоса озвучивания',
    aiBot: 'ИИ чатбот',
    translit: 'Показ/скрытие транслитерации на кнопках вариантов ответа',
    dontShow: 'Больше не показывать',
    close: 'Закрыть',

    // ✅ NEW
    sectionCard: 'Кнопки карточки глагола',
    cardIntro:
      'Эти кнопки находятся прямо на карточке глагола и помогают управлять тем, какие глаголы попадут в следующие задания.',
    exclude: 'Исключить глагол из следующих заданий (при необходимости можно вернуть).',
    pin: 'Добавить глагол в частую ротацию — он будет встречаться чаще в заданиях.',
    list: 'Открыть список исключённых глаголов: вернуть глагол в задания.',
  },

  en: {
    title: 'TASK 2 DESCRIPTION',
    intro1: 'In this exercise, you will be able to memorize and review about 300 of the most common Hebrew verbs.',
    intro2:
      'You will be shown the infinitive of a verb in English, along with four options for its translation into Hebrew. Your task is to choose the correct one.',
    intro3:
      'After answering, you will hear a simple sentence with this verb in Hebrew, which will help you better remember its usage and pronunciation. This exercise helps expand your vocabulary and improve your translation and listening skills in Hebrew.',
    section: 'Buttons',
    sound: 'Sound on/off buttons',
    stat: 'View exercise statistics',
    info: 'Exercise description',
    gender: 'Voice selection',
    aiBot: 'AI chatbot',
    translit: 'Show/hide transliteration on the answer option buttons',
    dontShow: 'Do not show again',

    // ✅ NEW
    sectionCard: 'Verb card buttons',
    cardIntro: 'These buttons are on the verb card and help you control which verbs will appear in future tasks.',
    exclude: 'Exclude this verb from the next tasks (you can restore it later).',
    pin: 'Add this verb to frequent rotation — it will appear more often in tasks.',
    list: 'Open the excluded verbs list: restore a verb back to the tasks.',
    close: 'Close',
  },

  fr: {
    title: 'DESCRIPTION DE L’EXERCICE 2',
    intro1:
      'Dans cet exercice, vous pourrez mémoriser et réviser environ 300 des verbes hébreux les plus courants.',
    intro2:
      'L’infinitif du verbe vous sera présenté en français, avec quatre options de traduction en hébreu. Votre tâche est de choisir la bonne réponse.',
    intro3:
      'Après votre réponse, une phrase simple avec ce verbe en hébreu vous sera proposée avec audio, ce qui vous aidera à retenir son utilisation et sa prononciation. Cet exercice aide à enrichir votre vocabulaire et à améliorer vos compétences en traduction et en compréhension orale en hébreu.',
    section: 'Boutons',
    sound: 'Boutons d’activation/désactivation du son',
    stat: "Voir les statistiques de l'exercice",
    info: "Description de l'exercice",
    gender: 'Choix de la voix',
    aiBot: 'Chatbot IA',
    translit: 'Afficher/masquer la translittération sur les boutons de réponse',
    dontShow: 'Ne plus afficher',

    // ✅ NEW
    sectionCard: 'Boutons de la carte du verbe',
    cardIntro:
      'Ces boutons se trouvent sur la carte du verbe et permettent de gérer quels verbes apparaîtront dans les prochains exercices.',
    exclude: 'Exclure ce verbe des prochains exercices (vous pourrez le rétablir plus tard).',
    pin: 'Ajouter ce verbe à la rotation fréquente — il apparaîtra plus souvent.',
    list: 'Ouvrir la liste des verbes exclus : rétablir un verbe dans les exercices.',
    close: 'Fermer',
  },

  es: {
    title: 'DESCRIPCIÓN DEL EJERCICIO 2',
    intro1: 'En este ejercicio podrás memorizar y repasar unos 300 de los verbos hebreos más comunes.',
    intro2:
      'Se te mostrará el infinitivo del verbo en español, junto con cuatro opciones de traducción al hebreo. Tu tarea es elegir la correcta.',
    intro3:
      'Después de responder, escucharás una frase simple con ese verbo en hebreo, lo que te ayudará a recordar mejor su uso y pronunciación. Este ejercicio contribuye a ampliar tu vocabulario y mejorar tus habilidades de traducción y comprensión auditiva en hebreo.',
    section: 'Botones',
    sound: 'Botones de sonido',
    stat: 'Ver estadísticas del ejercicio',
    info: 'Descripción del ejercicio',
    gender: 'Selección de voz',
    aiBot: 'Chatbot de IA',
    translit: 'Mostrar/ocultar la transliteración en los botones de respuesta',
    dontShow: 'No mostrar de nuevo',

    // ✅ NEW
    sectionCard: 'Botones de la tarjeta del verbo',
    cardIntro: 'Estos botones están en la tarjeta del verbo y te ayudan a controlar qué verbos aparecerán en las próximas tareas.',
    exclude: 'Excluir este verbo de las próximas tareas (puedes restaurarlo más tarde).',
    pin: 'Añadir este verbo a la rotación frecuente — aparecerá más a menudo.',
    list: 'Abrir la lista de verbos excluidos: devolver un verbo a las tareas.',
    close: 'Cerrar',
  },

  pt: {
    title: 'DESCRIÇÃO DO EXERCÍCIO 2',
    intro1: 'Neste exercício, você poderá memorizar e revisar cerca de 300 dos verbos hebraicos mais comuns.',
    intro2:
      'Será mostrado o infinitivo do verbo em português, com quatro opções de tradução para o hebraico. Sua tarefa é escolher a correta.',
    intro3:
      'Após a resposta, será apresentada uma frase simples com esse verbo em hebraico com áudio, o que ajudará você a lembrar melhor seu uso e pronúncia. Este exercício ajuda a expandir seu vocabulário e a melhorar suas habilidades de tradução e compreensão auditiva em hebraico.',
    section: 'Botões',
    sound: 'Botões de som',
    stat: 'Ver estatísticas do exercício',
    info: 'Descrição do exercício',
    gender: 'Seleção de voz',
    aiBot: 'Chatbot IA',
    translit: 'Mostrar/ocultar a transliteração nos botões de resposta',
    dontShow: 'Não mostrar novamente',

    // ✅ NEW
    sectionCard: 'Botões do cartão do verbo',
    cardIntro: 'Estes botões ficam no cartão do verbo e ajudam a controlar quais verbos aparecerão nas próximas tarefas.',
    exclude: 'Excluir este verbo das próximas tarefas (você pode restaurá-lo depois).',
    pin: 'Adicionar este verbo à rotação frequente — ele aparecerá mais vezes.',
    list: 'Abrir a lista de verbos excluídos: devolver um verbo às tarefas.',
    close: 'Fechar',
  },

  ar: {
    title: 'وَصف التمرين 2',
    intro1: 'في هذا التمرين، يمكنك حفظ ومراجعة حوالي 300 من أكثر الأفعال العبرية شيوعًا.',
    intro2:
      'سيتم عرض الفعل بصيغة المصدر باللغة العربية، إلى جانب أربع ترجمات ممكنة إلى العبرية. مهمتك هي اختيار الترجمة الصحيحة.',
    intro3:
      'بعد الإجابة، سيتم تشغيل جملة بسيطة تحتوي على هذا الفعل بالعبرية، مما سيساعدك على تذكر استخدامه ونطقه بشكل أفضل. هذا التمرين يساعدك على توسيع مفرداتك وتحسين مهارات الترجمة والاستماع باللغة العبرية.',
    section: 'الأزرار',
    sound: 'أزرار تشغيل/إيقاف الصوت',
    stat: 'عرض إحصائيات التمرين',
    info: 'وصف التمرين',
    gender: 'اختيار الصوت',
    aiBot: 'روبوت الدردشة الذكي',
    translit: 'إظهار/إخفاء النسخ الصوتي على أزرار الإجابات',
    dontShow: 'لا تظهر مرة أخرى',

    // ✅ NEW
    sectionCard: 'أزرار بطاقة الفعل',
    cardIntro: 'توجد هذه الأزرار على بطاقة الفعل وتساعدك على التحكم في الأفعال التي ستظهر في التمارين القادمة.',
    exclude: 'استبعاد هذا الفعل من التمارين القادمة (يمكنك إعادته لاحقًا).',
    pin: 'إضافة هذا الفعل إلى التكرار المتكرر — سيظهر أكثر في التمارين.',
    list: 'فتح قائمة الأفعال المستبعدة: إعادة الفعل ليظهر مرة أخرى في التمارين.',
    close: 'إغلاق',
  },

  am: {
    title: 'ልዩ ምልክት ስለ ልምድ 2',
    intro1: 'በዚህ ልምድ ውስጥ ከተለመዱት የዕብራይስጥ ግሶች 300 የሚጠጋገቡና የሚታወቁን መማረድና መድገም ይችላሉ።',
    intro2:
      'የግሱ ነፃ ቅርጽ በአማርኛ ይታያል፣ ከዚህ ጋር አራት የዕብራይስጥ ትርጉም አማራጮች ይሆናሉ። ትክክለኛውን ምርጫ ይምረጡ።',
    intro3:
      'ከመምረጥ በኋላ ይህንን ግስ የያዘ ቀላል እና የተድሞም አሰምት ይሰማችኋል። ይህ ልምድ ቃላትን ማሳደግና የትርጉምና የመስማት ችሎታን ማሻሻል ይረዳዎታል።',
    section: 'አዝራሮች',
    sound: 'የድምፅ መቀያየሪያ አዝራሮች',
    stat: 'የልምድ ስታቲስቲክስን ይመልከቱ',
    info: 'የልምድ መግለጫ',
    gender: 'የድምፅ ምርጫ',
    aiBot: 'አርቲፊሻል ኢንተሊጀንስ ቻትቦት',
    translit: 'ትራንስሊተሬሽንን በመልስ አዝራሮች ላይ ማሳየት/መደበቅ',
    dontShow: 'እንዳይታይ ያድርጉት',

    // ✅ NEW
    sectionCard: 'የግስ ካርድ ቁልፎች',
    cardIntro: 'እነዚህ ቁልፎች በግስ ካርድ ላይ ይገኛሉ፣ በሚቀጥሉ ልምምዶች የሚታዩ ግሶችን ለመቆጣጠር ይረዳዎታል።',
    exclude: 'ይህን ግስ ከሚቀጥሉ ልምምዶች ለጊዜው አስወግድ (በኋላ መመለስ ይቻላል)።',
    pin: 'ይህን ግስ ወደ ተደጋጋሚ ማሳያ አክል — በልምምዶች ውስጥ ከብዙ ጊዜ ይታያል።',
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

const TaskDescriptionModal6 = ({
  visible,
  onToggle,
  language,
  dontShowAgain2,
  onToggleDontShowAgain,
}) => {
  const normalizedInput = (language || '').toLowerCase().trim();
  const langCode = languageMap[normalizedInput] || 'en';
  const t = translations[langCode] || translations.en;

  return (
  <Modal
    animationType="slide"
    transparent
    visible={!!visible}
    presentationStyle="overFullScreen"
    statusBarTranslucent
    onRequestClose={onToggle}
  >
    <View style={styles.backdrop}>
      {/* фон кликабельный, но НЕ мешает ScrollView */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onToggle} />

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

          {/* Section: top buttons */}
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
            {t.section}
          </Text>

          <View style={styles.screenshotWrapper}>
            <Image source={require('./scr1.jpg')} style={styles.screenshot} />
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./SoundOn.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.sound}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Image source={require('./translit1.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.translit}
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
            {t.sectionCard}
          </Text>

          <View style={styles.screenshotWrapper}>
            <Image source={require('./scr31.jpg')} style={styles.screenshot} />
          </View>

          <Text style={[styles.modalText, { marginBottom: 10 }]} maxFontSizeMultiplier={1.2}>
            {t.cardIntro}
          </Text>

          <View style={styles.iconRow}>
            <Image source={require('./glaz2.png')} style={styles.icon} />
            <Text style={styles.iconText} maxFontSizeMultiplier={1.2}>
              {t.exclude}
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

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ✅ Bottom close */}
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
    backgroundColor: '#FFFDEF',
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

  // ✅ ключ: ScrollView занимает всё доступное место
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
