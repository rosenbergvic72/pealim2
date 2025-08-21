import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  AppState,
  ActivityIndicator,
  View,
  Image,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  // Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askChatGPT } from '../api/chatgptService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import FadeInView from './FadeInView';
import StyledMarkdown from './StyledMarkdown';
import SavedAnswersModal from './SavedAnswersModal';
import { ToastAndroid} from 'react-native';
// import { InteractionManager } from 'react-native';
import { shareAnswerOutsideModal } from './shareAnswerOutsideModal';
import { Share as RNShare, InteractionManager } from 'react-native';
import * as Clipboard from 'expo-clipboard';
// import { ToastAndroid } from 'react-native';





const ChatBotModal = ({ visible, onClose, blockModalCloseRef }) => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [lang, setLang] = useState('русский');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [scrollKey, setScrollKey] = useState(0);
  const [modalKey, setModalKey] = useState(0);
  const [verbContext, setVerbContext] = useState(null);

  const scrollViewRef = useRef(null);
  const lastVerbContextRef = useRef(null); // 🔄 хранит последний глагол


  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const isSharingRef = useRef(false);
  // 
  // const [blockModalClose, setBlockModalClose] = useState(false);
  // const blockModalCloseRef = useRef(false);
  
  const copyAnswer = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      ToastAndroid.show('Скопировано в буфер обмена', ToastAndroid.SHORT);
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const stripMarkdown = (markdown) => {
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, '')                       // удаление изображений ![alt](url)
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')                    // замена ссылок [text](url) → text
      .replace(/(\*\*|__)(.*?)\1/g, '$2')                    // жирный **text** или __text__
      .replace(/(\*|_)(.*?)\1/g, '$2')                       // курсив *text* или _text_
      .replace(/`([^`]+)`/g, '$1')                           // inline code
      .replace(/^\s*>+/gm, '')                               // цитаты
      .replace(/^-{3,}/g, '')                                // горизонтальные линии
      .replace(/^\s*#+\s*(.*)/gm, '$1')                      // заголовки # Heading → Heading
      .replace(/\|/g, ' ')                                   // вертикальные черты в таблицах
      .replace(/\n{2,}/g, '\n')                              // двойные отступы → один
      .trim();
  };

  const translations = {
    русский: {
      ask: 'Спросить',
      close: 'Закрыть',
      placeholder: 'Спроси про глагол...',
      you: 'Вы',
      bot: 'Бот',
      loading: 'Подождите, бот отвечает...',
      greeting: 'Привет! Я помогу тебе разобраться в иврите. Особенно — с глаголами и их спряжением 🔤',
      helpHint: 'Можешь спросить, например: как спрягать глагол ללכת или выбрать быстрый запрос ниже.',
      saved: '✅ Ответ сохранён!',
      errorSave: '❌ Не удалось сохранить ответ.',
    },
    english: {
      ask: 'Ask',
      close: 'Close',
      placeholder: 'Ask about a Hebrew verb...',
      you: 'You',
      bot: 'Bot',
      loading: 'Please wait, the bot is replying...',
      greeting: 'Hi! I can help you explore the Hebrew language — especially verbs and how to conjugate them 🔤',
      helpHint: 'You can ask, for example: how to conjugate the verb ללכת or choose a quick question below.',
      saved: '✅ Answer saved!',
      errorSave: '❌ Failed to save answer.',
    },
    français: {
      ask: 'Demander',
      close: 'Fermer',
      placeholder: 'Demande un verbe hébreu...',
      you: 'Vous',
      bot: 'Bot',
      loading: 'Veuillez patienter, le bot répond...',
      greeting: 'Bonjour ! Je peux t’aider à mieux comprendre l’hébreu — surtout les verbes et leur conjugaison 🔤',
      helpHint: 'Tu peux demander par exemple : comment conjuguer le verbe ללכת ou choisir une question rapide ci-dessous.',
      saved: '✅ Réponse enregistrée !',
      errorSave: '❌ Échec de l’enregistrement.',
    },
    español: {
      ask: 'Preguntar',
      close: 'Cerrar',
      placeholder: 'Pregunta sobre un verbo hebreo...',
      you: 'Tú',
      bot: 'Bot',
      loading: 'Espera un momento, el bot está respondiendo...',
      greeting: '¡Hola! Te ayudaré a entender el hebreo, en especial los verbos y cómo se conjugan 🔤',
      helpHint: 'PPuedes preguntar, por ejemplo: ¿cómo se conjuga el verbo ללכת? O elige una pregunta rápida abajo.',
      saved: '✅ ¡Respuesta guardada!',
      errorSave: '❌ Error al guardar la respuesta.',
    },
    português: {
      ask: 'Perguntar',
      close: 'Fechar',
      placeholder: 'Pergunte sobre um verbo hebraico...',
      you: 'Você',
      bot: 'Bot',
      loading: 'Aguarde, o bot está respondendo...',
      greeting: 'Olá! Estou aqui para te ajudar com o hebraico — especialmente com os verbos e suas conjugações 🔤',
      helpHint: 'Você pode perguntar, por exemplo: como conjugar o verbo ללכת ou escolher uma pergunta rápida abaixo.',
      saved: '✅ Resposta salva!',
      errorSave: '❌ Falha ao salvar a resposta.',
    },
    العربية: {
      ask: 'اسأل',
      close: 'إغلاق',
      placeholder: 'اسأل عن فعل عبري...',
      you: 'أنت',
      bot: 'بوت',
      loading: 'يرجى الانتظار، البوت يرد...',
      greeting: 'مرحبًا! سأساعدك على فهم اللغة العبرية، خصوصًا الأفعال وتصريفاتها 🔤',
      helpHint: 'يمكنك أن تسأل مثلًا: كيف يُصرّف الفعل ללכת؟ أو اختر سؤالًا سريعًا أدناه.',
      saved: '✅ تم حفظ الإجابة!',
      errorSave: '❌ فشل في حفظ الإجابة.',
    },
    አማርኛ: {
      ask: 'ጠይቅ',
      close: 'ዝጋ',
      placeholder: 'ስለ የዕብራይስጥ ግስ ጠይቅ...',
      you: 'አንተ',
      bot: 'ቦት',
      loading: 'እባክህ ቆይ፣ ቦቱ በመስጠት ላይ ነው...',
      greeting: 'ሰላም! በዕብራይስጥ ቋንቋ ላይ ልትረዳ እችላለሁ። በተለይም በግሶችና በመለያየታቸው ላይ 🔤',
      helpHint: 'ለምሳሌ፣ የሚሉትን መጠየቅ ትችላለህ፦ የללכת ግስ እንዴት ነው የሚሰራው? ወይም ከታች ፈጣን ጥያቄ ይምረጡ።',
      saved: '✅ መልስ ተቀምጧል!',
      errorSave: '❌ መልስ ማስቀመጥ አልተሳካም።',
    }
  };
  
  const [quickQuestions, setQuickQuestions] = useState([]);

  const fetchQuickQuestions = async (lang) => {
  try {
    const res = await fetch(`https://verbify-api.onrender.com/api/quick-questions?lang=${encodeURIComponent(lang)}`);
    const data = await res.json();
    setQuickQuestions(data);
  } catch (err) {
    console.error('Ошибка загрузки быстрых вопросов:', err);
    setQuickQuestions([]);
  }
};

useEffect(() => {
  if (visible && lang) {
    fetchQuickQuestions(lang);
  }
}, [visible, lang]);


  


  const conjugateButtonLabels = {
    русский: '📊 Проспрягать этот глагол',
    english: '📊 Conjugate this verb',
    français: '📊 Conjugue ce verbe',
    español: '📊 Conjuga este verbo',
    português: '📊 Conjugar este verbo',
    العربية: '📊 صرّف هذا الفعل',
    አማርኛ: '📊 እባክህ ይህን ግስ አቅርብ',
  };

  const conjugateCommand = {
    русский: (verb) => `Проспрягать глагол ${verb}`,
    english: (verb) => `Conjugate the verb ${verb}`,
    français: (verb) => `Conjugue le verbe ${verb}`,
    español: (verb) => `Conjuga el verbo ${verb}`,
    português: (verb) => `Conjuga o verbo ${verb}`,
    العربية: (verb) => `صَرِّف الفعل ${verb}`,
    አማርኛ: (verb) => `ይህን ግስ ${verb} አቅርብ`,
  };

  const t = translations[lang] || translations.english;

  const handleClose = async (clearHistory = false) => {
    if (blockModalCloseRef.current) {
      console.log('⛔ handleClose отменён: блокировка активна');
      return;
    }
    if (clearHistory) {
      await AsyncStorage.removeItem('chatHistory');
      setHistory([]);
    } else {
      try {
        // await AsyncStorage.setItem('chatHistory', JSON.stringify(history));
        const sessionId = await AsyncStorage.getItem('chatSessionId');
await AsyncStorage.setItem('chatHistory', JSON.stringify({
  sessionId,
  messages: history,
}));
        console.log('✅ История чата сохранена перед закрытием модалки');
      } catch (err) {
        console.error('❌ Ошибка сохранения истории при закрытии:', err);
      }
    }
  
    setQuestion('');
    setIsLoading(false);
    setVerbContext(null);
    setShowScrollToBottom(false);
    // scrollViewRef.current = null;
    setScrollKey(prev => prev + 1);
    setModalKey(prev => prev + 1);
    hasLoaded.current = false;
  
    // ⬇️ Задержка, чтобы гарантировать завершение сохранения
    await new Promise(resolve => setTimeout(resolve, 50));
  
    onClose(); // вызывается в самом конце
  };
  
  
  const saveChatHistory = async (history) => {
  const sessionId = await AsyncStorage.getItem('chatSessionId');
  await AsyncStorage.setItem('chatHistory', JSON.stringify({
    sessionId,
    messages: history,
  }));
};
  
  
  // useEffect(() => {
  //   if (visible && history.length > 0) {
  //     const nonEmptyHistory = history.filter(item => item.reply !== null);
  //     if (nonEmptyHistory.length > 0) {
  //       console.log('💾 Сохраняем историю чата:', nonEmptyHistory);
  //       AsyncStorage.setItem('chatHistory', JSON.stringify(nonEmptyHistory))
  //         .then(() => console.log('✅ История чата сохранена в AsyncStorage'))
  //         .catch((err) => console.error('❌ Ошибка сохранения истории чата:', err));
  //     }
  //   }
  // }, [history, visible]);
  
  
  
  
  const hasLoaded = useRef(false);

useEffect(() => {
  if (visible && !hasLoaded.current) {
    console.log('🚀 Modal открылась, запускаем loadData()');
    hasLoaded.current = true;
    loadData();
  } else if (!visible) {
    if (!blockModalCloseRef.current) {
      console.log('🔁 Сброс hasLoaded и истории');
      hasLoaded.current = false;
      setHistory([]);
    } else {
      console.log('❎ История НЕ сброшена (blockModalClose активно)');
    }
  }
}, [visible]);

  
  
  
  
  
  
  
  
const loadData = async () => {
  try {
    const sessionId = await AsyncStorage.getItem('chatSessionId');
    if (!sessionId) {
      console.log('🛑 Новая сессия — история чата не загружается');
      return;
    }

    const name = await AsyncStorage.getItem('name');
    const language = await AsyncStorage.getItem('language');
    if (name) setUsername(name);
    if (language) setLang(language);

    let saved = await AsyncStorage.getItem('chatHistory');
    if (!saved || saved === 'null') {
      await new Promise(resolve => setTimeout(resolve, 300));
      saved = await AsyncStorage.getItem('chatHistory');
    }

    let parsed = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch {}
    }

    if (parsed && parsed.sessionId === sessionId && Array.isArray(parsed.messages)) {
      setHistory(parsed.messages);
    } else {
      const greeting = translations[language]?.greeting || translations.english.greeting;
      const hint = translations[language]?.helpHint || translations.english.helpHint;
      const userName = name || translations[language]?.you || 'You';

      setHistory([
        {
          question: null,
          reply: `**${userName}**\n${greeting}\n${hint}`,
          isWelcome: true,
        },
      ]);
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки истории чата:', err);
  }
};


  
  
  
  
  
  
  

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [history]);
  

  useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
  if (
    appState === 'active' &&
    (nextAppState === 'background' || nextAppState === 'inactive')
  ) {
    if (!isSharingRef.current && !blockModalCloseRef.current && visible) {
      try {
        const sessionId = await AsyncStorage.getItem('chatSessionId');
        await AsyncStorage.setItem('chatHistory', JSON.stringify({
          sessionId,
          messages: history,
        }));
        console.log('✅ История чата сохранена при сворачивании');
      } catch (e) {
        console.error('❌ Ошибка сохранения истории чата при сворачивании:', e);
      }
    }
  }
  setAppState(nextAppState);
});

  return () => subscription.remove();
}, [appState, visible, history]);

  
  
  
  
  

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
  
    Keyboard.dismiss();
    await playSendSound();
    setTimeout(() => setIsLoading(true), 300);
  
    const newQuestion = question.trim();
    const normalized = newQuestion.toLowerCase();
    const isYes = ['да', 'хочу', 'да, хочу', 'да хочу', 'давай', 'покажи', 'покажи спряжение', 'хочу увидеть', 'конечно',

      // 🇬🇧 English
      'yes', 'i want', 'yes i want', 'show me', 'show conjugation', 'let me see', 'of course',
    
      // 🇫🇷 Français
      'oui', 'je veux', 'oui je veux', 'montre', 'montre-moi', 'bien sûr',
    
      // 🇪🇸 Español
      'sí', 'quiero', 'sí quiero', 'muéstrame', 'por supuesto',
    
      // 🇵🇹 Português
      'sim', 'eu quero', 'sim eu quero', 'me mostra', 'claro',
    
      // 🇸🇦 Arabic
      'نعم', 'أريد', 'نعم أريد', 'أرني', 'بالطبع',
    
      // 🇪🇹 Amharic
      'አዎ', 'እፈልጋለሁ', 'አዎ እፈልጋለሁ', 'አሳየኝ', 'እሺ'].includes(normalized);

    if (isYes && lastVerbContextRef.current) {
      const conjugateText = conjugateCommand[lang]?.(lastVerbContextRef.current) || conjugateCommand.english(lastVerbContextRef.current);
      await handleAskAuto(conjugateText);
      setQuestion('');
      setIsLoading(false);
      return;
    }
  
    const verbToUse = isYes ? lastVerbContextRef.current : '';
  
    const tempMessage = {
      question: newQuestion,
      reply: null,
      verbContext: null,
      isVerbSuggestion: false,
    };
    setHistory(prev => [tempMessage, ...prev]);
  
    const formattedHistory = history
      .slice(0, 5)
      .reverse()
      .flatMap(item => [
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.reply },
      ]);
  
    let reply;
    try {
      reply = await askChatGPT(newQuestion, formattedHistory, verbToUse);
    } catch (error) {
      console.error('Ошибка при запросе к боту:', error);
      await playReplySound();
      setIsLoading(false);
      return;
    }
  
    const extractedVerb = extractVerbFromReply(reply);
    const isVerbSuggestion = extractedVerb && !isConjugationReply(reply);
  
    // 🛠 КРИТИЧЕСКОЕ: Обновляем lastVerbContextRef ДО вызова handleAskAuto
    const actualVerb = extractedVerb || verbToUse;
    setVerbContext(actualVerb);
    lastVerbContextRef.current = actualVerb;
  
    // ⬇️ Если это подтверждение (да), сразу делаем автозапрос
    if (isYes && verbToUse) {
      const conjugateText = conjugateCommand[lang]?.(verbToUse) || conjugateCommand.english(verbToUse);
      setQuestion('');
      setIsLoading(false);
      await handleAskAuto(conjugateText);
      return;
    }
  
    // ⬇️ В обычном случае — просто добавляем ответ
    setHistory(prev =>
      prev.map((item, index) =>
        index === 0
          ? {
              ...item,
              reply,
              verbContext: actualVerb,
              isVerbSuggestion,
            }
          : item
      )
    );
  
    setQuestion('');
    await playReplySound();
    setIsLoading(false);
  };
  
  
  
  
  
  
  const playSendSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./click.mp3')

      );
      await sound.playAsync();
    } catch (e) {
      console.warn('Не удалось воспроизвести звук отправки:', e);
    }
  };
  
  const playReplySound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./click.mp3')

      );
      await sound.playAsync();
    } catch (e) {
      console.warn('Не удалось воспроизвести звук ответа:', e);
    }
  };
  
  
  const playReceiveSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require('./click.mp3'));
    await sound.playAsync();
  };
  
  
  


  const handleAskAuto = async (customQuestion) => {
    if (!customQuestion.trim()) return;
  
    Keyboard.dismiss();
    await playSendSound();
    setIsLoading(true);
  
    const normalized = customQuestion.toLowerCase();
    const isYes = ['да', 'yes', 'oui', 'sí', 'sim', 'نعم', 'አዎ'].includes(normalized);
    const previousVerb = lastVerbContextRef.current || '';
  
    const verbToUse = isYes ? previousVerb : '';
  
    setHistory(prev => [
      { question: customQuestion, reply: null, verbContext: null },
      ...prev
    ]);
  
    const formattedHistory = history
      .slice(0, 5)
      .reverse()
      .flatMap(item => [
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.reply }
      ]);
  
    let replyAuto;
    try {
      replyAuto = await askChatGPT(customQuestion, formattedHistory, verbToUse);
      await playReceiveSound();
    } catch (err) {
      console.error('❌ Ошибка в handleAskAuto:', err);
      setIsLoading(false);
      return;
    }
  
    const extractedVerbAuto = extractVerbFromReply(replyAuto);
    const isVerbSuggestionAuto = extractedVerbAuto && !isConjugationReply(replyAuto);
  
    const actualVerb = extractedVerbAuto || previousVerb;
    setVerbContext(actualVerb);
    lastVerbContextRef.current = actualVerb;
  
    setHistory(prev =>
      prev.map((item, index) =>
        index === 0
          ? {
              ...item,
              reply: replyAuto,
              verbContext: actualVerb,
              isVerbSuggestion: isVerbSuggestionAuto,
            }
          : item
      )
    );
  
    setIsLoading(false);
  };
  
  
  
  
  



  

  const handleShare = (text) => {
    const cleanedText = stripMarkdown(text);
  
    InteractionManager.runAfterInteractions(() => {
      RNShare.share({ message: cleanedText }).catch((err) => {
        console.error('Ошибка при шаринге:', err);
      });
    });
  };
  
  
  
  
  

  const extractVerbFromReply = (reply) => {
    const match = reply.match(/глагол\s+"([^"]+)"/i) ||
                  reply.match(/verb\s+"([^"]+)"/i) ||
                  reply.match(/verbe\s+"([^"]+)"/i) ||
                  reply.match(/verbo\s+"([^"]+)"/i) ||
                  reply.match(/فعل\s+"([^"]+)"/i) ||
                  reply.match(/ግስ\s+"([^"]+)"/i);
    return match ? match[1] : null;
  };

  const isConjugationReply = (text) => {
    const lowered = text?.toLowerCase() || '';
  
    return (
      // Русский
      lowered.includes('инфинитив:') ||
      lowered.includes('биньян:') ||
      lowered.includes('корень:') ||
  
      // Английский
      lowered.includes('infinitive:') ||
      lowered.includes('binyan:') ||
      lowered.includes('root:') ||
  
      // Французский
      lowered.includes('infinitif:') ||
      lowered.includes('verbe:') ||
      lowered.includes('racine:') ||
  
      // Испанский
      lowered.includes('infinitivo:') ||
      lowered.includes('verbo:') ||
      lowered.includes('raíz:') ||
  
      // Португальский
      lowered.includes('infinitivo:') ||
      lowered.includes('verbo:') ||
      lowered.includes('raiz:') ||
  
      // Арабский (грубая проверка)
      lowered.includes('صيغة المصدر') || // infinitive
      lowered.includes('الفعل') ||       // verb
      lowered.includes('الجذر') ||       // root
  
      // Амхарский (грубая проверка, можно улучшить)
      lowered.includes('መለኪያ') ||     // инфинитив
      lowered.includes('ግስ') ||       // глагол
      lowered.includes('ምንጭ')         // корень
    );

    };

    const handleSave = async (text) => {
      try {
        const existing = await AsyncStorage.getItem('savedAnswers');
        const saved = existing ? JSON.parse(existing) : [];
    
        const newEntry = {
          id: Date.now(),
          text,
          timestamp: new Date().toISOString(),
        };
    
        await AsyncStorage.setItem('savedAnswers', JSON.stringify([newEntry, ...saved]));
    
        // Вместо alert
        showToast(translations[lang]?.saved || translations.english.saved);
    
        // Виброэффект
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Ошибка при сохранении ответа:', error);
        showToast(translations[lang]?.errorSave || translations.english.errorSave);
      }
    };
    
    
    const showToast = (message) => {
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        alert(message); // для iOS можно будет потом заменить на красивое всплывающее уведомление
      }
    };

  return (
    <>
      {visible && (
        <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={async () => {
          console.log('📦 onRequestClose вызван');
          if (blockModalCloseRef.current) {
            console.log('🚫 Закрытие ChatBotModal заблокировано (share in progress)');
            return;
          }
        
          console.log('✅ Закрытие разрешено, вызываем handleClose');
          await handleClose(false); // сохраняет историю!
        }}
        
        
      >
  
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
            <View style={styles.container}>

              {/* Header */}
              <View style={styles.header}>
  {/* Лого слева */}
  <Image source={require('../VERBIFY.png')} style={styles.logo} />

  {/* Пустое пространство посередине, чтобы прижать иконки вправо */}
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <TouchableOpacity onPress={() => setSavedModalVisible(true)} style={styles.iconButton}>
      <Image source={require('../save2.png')} style={styles.iconImage} />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => handleClose()}>
      <Ionicons name="close" size={36} color="#003366" />
    </TouchableOpacity>
  </View>
</View>


              {/* Scrollable chat */}
              <ScrollView
  key={scrollKey}
  ref={scrollViewRef}
  style={styles.chat}
  contentContainerStyle={{ paddingBottom: 80 }}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="interactive"
  onScroll={event => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setShowScrollToBottom(!isNearBottom && contentOffset.y > 200);
  }}
  scrollEventThrottle={16}
>
                {history.map((item, index) => {
  const isLast = index === 0;
  return (
    <View key={index} style={[styles.messageBlock, isLast && styles.highlightMessage]}>
      {/* Вопрос пользователя */}
      {item.question ? (
  <View style={styles.questionBubble}>
    <View style={styles.labelTag}>
  <Text style={styles.labelText} maxFontSizeMultiplier={1.2}>
    {username || t.you}
  </Text>
</View>
    <Text style={styles.userQuestion} maxFontSizeMultiplier={1.2}>
      {item.question}
    </Text>
  </View>
) : null}

      {/* Ответ бота */}
      <View style={styles.answerBubble}>
        {item.reply ? (
          <FadeInView>
            <>
              {/* Лого бота */}
              <View style={styles.botHeader}>
                <View style={styles.botIconWrapper}>
                  <Image source={require('../AI2.png')} style={styles.botIcon} />
                </View>
              </View>

              {/* Текст ответа */}
              {typeof item.reply === 'string' ? (
  <StyledMarkdown>{item.reply}</StyledMarkdown>
) : (
  <Text style={styles.emptyText}maxFontSizeMultiplier={1.2}>
    🚫 Error loading text
  </Text>
)}


              {/* Кнопка "Проспрягать этот глагол" */}
              {index === 0 && item.isVerbSuggestion && (
  <TouchableOpacity
    style={styles.extraButton}
    onPress={async () => {
      const conjugateText = conjugateCommand[lang] ? conjugateCommand[lang](verbContext) : conjugateCommand.english(verbContext);
      await handleAskAuto(conjugateText);
    }}
  >

    <Text style={styles.extraButtonText}maxFontSizeMultiplier={1.2}>
      {conjugateButtonLabels[lang] || conjugateButtonLabels.english}
    </Text>
  </TouchableOpacity>
)}

{/* Кнопка "Поделиться" — только если нет быстрых вопросов и нет кнопки спряжения */}
{item.reply && !item.isWelcome && (
 <View style={styles.shareWrapper}>
 {/* Кнопка Сохранить */}
 <TouchableOpacity
   onPress={() => handleSave(item.reply)}
   style={[styles.saveButton, { marginRight: 12 }]}
   activeOpacity={0.8}
 >
   <Image source={require('../save1.png')} style={styles.saveIcon} />
 </TouchableOpacity>

 {/* Кнопка Копировать */}
 <TouchableOpacity
   onPress={() => copyAnswer(item.reply)}
   style={[styles.copyButton, { marginRight: 12 }]}
   activeOpacity={0.8}
 >
   <Ionicons name="copy" size={22} color="#003366" />
 </TouchableOpacity>

 {/* Кнопка Поделиться */}
 <TouchableOpacity
   onPress={() => shareAnswerOutsideModal(item.reply, null, blockModalCloseRef)}
   style={styles.shareButton}
   activeOpacity={0.8}
 >
   <Image source={require('../share.png')} style={styles.shareIcon} />
 </TouchableOpacity>
</View>

)}



              {/* Быстрые вопросы если есть */}
{item.isWelcome && quickQuestions && quickQuestions.length > 0 && (
  <View style={styles.quickQuestionsWrapper}>
    {quickQuestions.map((q, idx) => (
      <TouchableOpacity
        key={idx}
        activeOpacity={0.7}
        style={[styles.quickButton, isLoading && { opacity: 0.4 }]}
        onPress={() => !isLoading && handleAskAuto(q.question)}
        disabled={isLoading}
      >
        <Text style={styles.quickButtonText} maxFontSizeMultiplier={1.2}>
          {q.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}

            </>
          </FadeInView>
        ) : (
          <View style={styles.loadingWrapper}>
  <Image source={require('../AI2.png')} style={styles.botIconSmall} />
  <ActivityIndicator size="small" color="#4A6491" style={{ marginLeft: 2, marginRight: 5 }} />
  <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>
    {t.loading}
  </Text>
</View>

        )}
      </View>
    </View>
  );
})}

              </ScrollView>

              {/* Scroll to bottom button */}
           {showScrollToBottom && (
  <TouchableOpacity
    onPress={() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      setShowScrollToBottom(false); // <-- вот так!
    }}
    style={styles.scrollToBottomButton}
  >
    <Ionicons name="arrow-down" size={28} color="#4A6491" />
  </TouchableOpacity>
)}

              {/* Input */}
              <View style={styles.inputWrapper}>
              <TextInput
  value={question}
  onChangeText={setQuestion}
  placeholder={t.placeholder}
  style={[
    styles.inputWithButton,
    isLoading && styles.inputDisabled,
    lang === 'العربية' && { paddingRight: 60, textAlign: 'right' }, // 👈 добавлено
  ]}
  multiline
  editable={!isLoading}
  textAlignVertical="top"
  maxFontSizeMultiplier={1.2}
/>

                <TouchableOpacity
                  onPress={handleAsk}
                  style={[styles.sendButton, isLoading && { opacity: 0.5 }]}
                  disabled={isLoading}
                >
                  <Ionicons name="arrow-up-circle" size={36} color="#4A6491" />
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

{savedModalVisible && (
  <SavedAnswersModal
    visible={savedModalVisible}
    onClose={() => setSavedModalVisible(false)}
    blockModalCloseRef={blockModalCloseRef}
  />
)}



    </>
  );
};

  
  



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB', // можно 'white', но это мягкий светло-синий
  },
  closeIcon: {
    padding: 5,
    marginTop: Platform.OS === 'ios' ? 0 : -4, // чуть выше
  },
  chat: { flex: 1, marginTop: 10, marginLeft:10, marginRight:10, },
  messageBlock: {
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10, // ← добавляем отступы для всех сообщений
  },
  
  highlightMessage: {
    backgroundColor: '#EEF3FB',
    borderColor: '#4A6491',
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
  },
  
  questionBubble: {
    backgroundColor: '#D1E3F1',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    // width: '100%',
  },
  answerBubble: {
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 5,
    // alignSelf: 'flex-start',
    // maxWidth: '100%',
    width: '100%',
    position: 'relative', 
  },

  labelTag: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  
  labelText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#003366',
    borderRadius: 6,
    overflow: 'hidden', // обязательно!
  },
  
  userQuestion: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 8, // добавить отступ сверху
    marginBottom: 5,
    // marginleft: 20
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    borderRadius: 5,
    minHeight: 40,
    maxHeight: 100,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12, // аккуратные отступы по бокам
    height: 60,             // уменьшенная высота
    backgroundColor: '#D1E3F1',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  
  
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  closeIcon: {
    // padding: 5,
  },
  // chat: {
  //   flex: 1,
  //   marginTop: 10,
  // },
  botHeader: {
    width: '100%',
    // alignItems: 'flex-start',
    justifyContent: 'center',
  // alignItems: 'center',
    height: 30,
    marginBottom: 1,
    // margintop: 15,
  },

  botIconWrapper: {
    backgroundColor: '#D1E3F1',
    borderRadius: 8,
    width: 65,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // обрежет выступающие углы
  },
  
  botIcon: {
    
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  // sendButton: {
  //   marginLeft: 8,
  // },
  inputWrapper: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
    marginLeft:10,
    marginRight:10,
  },
  
  inputWithButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingRight: 44, // отступ справа для иконки
    minHeight: 44,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  
  sendButton: {
    position: 'absolute',
    right: 10,
    top: '40%',
    transform: [{ translateY: -14 }],
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexWrap: 'wrap', // 💥 добавить перенос строк
    maxWidth: '85%', // 💥 ограничить ширину пузыря
    backgroundColor: '#FFFDEF', // (если хочешь сделать фон как у ответов)
    borderRadius: 10, // (для красоты)
  },
  
  loadingText: {
    fontStyle: 'italic',
    color: '#888',
    fontSize: 12,
    marginleft: 10,
  },
  inputDisabled: {
    backgroundColor: '#e4e4e4',
    color: '#999',
  },
  extraButton: {
    marginTop: 8,
    backgroundColor: '#dce7f5',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  extraButtonText: {
    fontSize: 15,
    color: '#003366',
    fontWeight: '600',
  },

  shareWrapper: {
    marginTop: 6,
    flexDirection: 'row', // <-- это главное
    justifyContent: 'flex-end',
    alignItems: 'center', // <-- чтобы по вертикали выровнять
    gap: 10, // для небольшого расстояния между кнопками
  },
  
  shareButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  
  shareIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  

  shareAbsolute: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    padding: 3,
  },
  
  shareIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  quickQuestionsWrapper: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6, // для React Native Web поддержка нужна, можно заменить на margin
  },
  quickButton: {
    backgroundColor: '#dce7f5',
    marginHorizontal: 2,
    marginVertical: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: '42%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100, // над полем ввода
    right: 20,
    backgroundColor: '#dce7f5',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  botIconSmall: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    // backgroundColor: '#D1E3F1',
    // borderRadius: 8,
    
  },

  saveButton: {
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    elevation: 2,
  },
  
  saveIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  iconButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  iconImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    elevation: 2,
  },
  
});

export default ChatBotModal;
