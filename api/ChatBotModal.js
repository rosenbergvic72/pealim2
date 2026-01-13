// ChatBotModal.js
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
  ToastAndroid,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askChatGPT } from '../api/chatgptService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import FadeInView from './FadeInView';
import StyledMarkdown from './StyledMarkdown';
import SavedAnswersModal from './SavedAnswersModal';
import { shareAnswerOutsideModal } from './shareAnswerOutsideModal';
import * as Clipboard from 'expo-clipboard';

const ChatBotModal = ({ visible, onClose, blockModalCloseRef }) => {
  const insets = useSafeAreaInsets();

  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [lang, setLang] = useState('русский');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [scrollKey, setScrollKey] = useState(0);
  const [verbContext, setVerbContext] = useState(null);

  const scrollViewRef = useRef(null);
  const lastVerbContextRef = useRef(null);

  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const isSharingRef = useRef(false);

  const copyAnswer = async (text) => {
    try {
      await Clipboard.setStringAsync(String(text || ''));
      if (Platform.OS === 'android') {
        ToastAndroid.show('Скопировано в буфер обмена', ToastAndroid.SHORT);
      } else {
        alert('Copied to clipboard');
      }
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const translations = {
    русский: {
      placeholder: 'Спроси про глагол...',
      you: 'Вы',
      loading: 'Подождите, бот отвечает...',
      greeting:
        'Привет! Я помогу тебе разобраться в иврите. Особенно — с глаголами и их спряжением 🔤',
      helpHint:
        'Можешь спросить, например: как спрягать глагол ללכת или выбрать быстрый запрос ниже.',
      saved: '✅ Ответ сохранён!',
      errorSave: '❌ Не удалось сохранить ответ.',
    },
    english: {
      placeholder: 'Ask about a Hebrew verb...',
      you: 'You',
      loading: 'Please wait, the bot is replying...',
      greeting:
        'Hi! I can help you explore the Hebrew language — especially verbs and how to conjugate them 🔤',
      helpHint:
        'You can ask, for example: how to conjugate the verb ללכת or choose a quick question below.',
      saved: '✅ Answer saved!',
      errorSave: '❌ Failed to save answer.',
    },
    français: {
      placeholder: 'Demande un verbe hébreu...',
      you: 'Vous',
      loading: 'Veuillez patienter, le bot répond...',
      greeting:
        'Bonjour ! Je peux t’aider à mieux comprendre l’hébreu — surtout les verbes et leur conjugaison 🔤',
      helpHint:
        'Tu peux demander par exemple : comment conjuguer le verbe ללכת ou choisir une question rapide ci-dessous.',
      saved: '✅ Réponse enregistrée !',
      errorSave: '❌ Échec de l’enregistrement.',
    },
    español: {
      placeholder: 'Pregunta sobre un verbo hebreo...',
      you: 'Tú',
      loading: 'Espera un momento, el bot está respondiendo...',
      greeting:
        '¡Hola! Te ayudaré a entender el hebreo, en especial los verbos y cómo se conjugan 🔤',
      helpHint:
        'Puedes preguntar, por ejemplo: ¿cómo se conjuga el verbo ללכת? O elige una pregunta rápida abajo.',
      saved: '✅ ¡Respuesta guardada!',
      errorSave: '❌ Error al guardar la respuesta.',
    },
    português: {
      placeholder: 'Pergunte sobre um verbo hebraico...',
      you: 'Você',
      loading: 'Aguarde, o bot está respondendo...',
      greeting:
        'Olá! Estou aqui para te ajudar com o hebraico — especialmente com os verbos e suas conjugações 🔤',
      helpHint:
        'Você pode perguntar, por exemplo: como conjugar o verbo ללכת ou escolher uma pergunta rápida abaixo.',
      saved: '✅ Resposta salva!',
      errorSave: '❌ Falha ao salvar a resposta.',
    },
    العربية: {
      placeholder: 'اسأل عن فعل عبري...',
      you: 'أنت',
      loading: 'يرجى الانتظار، البوت يرد...',
      greeting:
        'مرحبًا! سأساعدك على فهم اللغة العبرية، خصوصًا الأفعال وتصريفاتها 🔤',
      helpHint:
        'يمكنك أن تسأل مثلًا: كيف يُصرّف الفعل ללכת؟ أو اختر سؤالًا سريعًا أدناه.',
      saved: '✅ تم حفظ الإجابة!',
      errorSave: '❌ فشل في حفظ الإجابة.',
    },
    አማርኛ: {
      placeholder: 'ስለ የዕብራይስጥ ግስ ጠይቅ...',
      you: 'አንተ',
      loading: 'እባክህ ቆይ፣ ቦቱ በመስጠት ላይ ነው...',
      greeting:
        'ሰላም! በዕብራይስጥ ቋንቋ ላይ ልትረዳ እችላለሁ። በተለይም በግሶችና በመለያየታቸው ላይ 🔤',
      helpHint:
        'ለምሳሌ፣ የሚሉትን መጠየቅ ትችላለህ፦ የללכת ግስ እንዴት ነው የሚሰራው? ወይም ከታች ፈጣን ጥያቄ ይምረጡ።',
      saved: '✅ መልስ ተቀምጧል!',
      errorSave: '❌ መልስ ማስቀመጥ አልተሳካም።',
    },
  };

  const t = translations[lang] || translations.english;

  const [quickQuestions, setQuickQuestions] = useState([]);

  const fetchQuickQuestions = async (lng) => {
    try {
      const res = await fetch(
        `https://verbify-api.onrender.com/api/quick-questions?lang=${encodeURIComponent(lng)}`
      );
      const data = await res.json();
      setQuickQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки быстрых вопросов:', err);
      setQuickQuestions([]);
    }
  };

  useEffect(() => {
    if (visible && lang) fetchQuickQuestions(lang);
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

  const hasLoaded = useRef(false);

  const loadData = async () => {
    try {
      const sessionId = await AsyncStorage.getItem('chatSessionId');
      if (!sessionId) return;

      const name = await AsyncStorage.getItem('name');
      const language = await AsyncStorage.getItem('language');
      if (name) setUsername(name);
      if (language) setLang(language);

      let saved = await AsyncStorage.getItem('chatHistory');
      if (!saved || saved === 'null') {
        await new Promise((resolve) => setTimeout(resolve, 300));
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
    if (visible && !hasLoaded.current) {
      hasLoaded.current = true;
      loadData();
    } else if (!visible) {
      if (!blockModalCloseRef?.current) {
        hasLoaded.current = false;
        setHistory([]);
      }
    }
  }, [visible]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [history]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        if (!isSharingRef.current && !blockModalCloseRef?.current && visible) {
          try {
            const sessionId = await AsyncStorage.getItem('chatSessionId');
            await AsyncStorage.setItem(
              'chatHistory',
              JSON.stringify({ sessionId, messages: history })
            );
          } catch (e) {}
        }
      }
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState, visible, history, blockModalCloseRef]);

  const playSendSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./click.mp3'));
      await sound.playAsync();
    } catch {}
  };
  const playReplySound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./click.mp3'));
      await sound.playAsync();
    } catch {}
  };
  const playReceiveSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./click.mp3'));
      await sound.playAsync();
    } catch {}
  };

  const extractVerbFromReply = (reply) => {
    const text = String(reply || '');
    const match =
      text.match(/глагол\s+"([^"]+)"/i) ||
      text.match(/verb\s+"([^"]+)"/i) ||
      text.match(/verbe\s+"([^"]+)"/i) ||
      text.match(/verbo\s+"([^"]+)"/i) ||
      text.match(/فعل\s+"([^"]+)"/i) ||
      text.match(/ግስ\s+"([^"]+)"/i);
    return match ? match[1] : null;
  };

  const isConjugationReply = (text) => {
    const lowered = String(text || '').toLowerCase();
    return (
      lowered.includes('инфинитив:') ||
      lowered.includes('биньян:') ||
      lowered.includes('корень:') ||
      lowered.includes('infinitive:') ||
      lowered.includes('binyan:') ||
      lowered.includes('root:') ||
      lowered.includes('infinitif:') ||
      lowered.includes('racine:') ||
      lowered.includes('infinitivo:') ||
      lowered.includes('raíz:') ||
      lowered.includes('raiz:') ||
      lowered.includes('صيغة المصدر') ||
      lowered.includes('الجذر') ||
      lowered.includes('ግስ')
    );
  };

  const handleAskAuto = async (customQuestion) => {
    if (!String(customQuestion || '').trim()) return;

    Keyboard.dismiss();
    await playSendSound();
    setIsLoading(true);

    setHistory((prev) => [{ question: customQuestion, reply: null }, ...prev]);

    const formattedHistory = history
      .slice(0, 5)
      .reverse()
      .flatMap((item) => [
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.reply },
      ]);

    let replyAuto;
    try {
      replyAuto = await askChatGPT(customQuestion, formattedHistory, '');
      await playReceiveSound();
    } catch (err) {
      setIsLoading(false);
      return;
    }

    const extractedVerbAuto = extractVerbFromReply(replyAuto);
    const isVerbSuggestionAuto = extractedVerbAuto && !isConjugationReply(replyAuto);

    const actualVerb = extractedVerbAuto || lastVerbContextRef.current || null;
    setVerbContext(actualVerb);
    lastVerbContextRef.current = actualVerb;

    setHistory((prev) =>
      prev.map((item, idx) =>
        idx === 0 ? { ...item, reply: replyAuto, isVerbSuggestion: isVerbSuggestionAuto } : item
      )
    );

    setIsLoading(false);
  };

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;

    Keyboard.dismiss();
    await playSendSound();
    setTimeout(() => setIsLoading(true), 200);

    const newQuestion = question.trim();

    setHistory((prev) => [{ question: newQuestion, reply: null }, ...prev]);

    const formattedHistory = history
      .slice(0, 5)
      .reverse()
      .flatMap((item) => [
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.reply },
      ]);

    let reply;
    try {
      reply = await askChatGPT(newQuestion, formattedHistory, '');
    } catch (error) {
      await playReplySound();
      setIsLoading(false);
      return;
    }

    const extractedVerb = extractVerbFromReply(reply);
    const isVerbSuggestion = extractedVerb && !isConjugationReply(reply);

    const actualVerb = extractedVerb || null;
    setVerbContext(actualVerb);
    lastVerbContextRef.current = actualVerb;

    setHistory((prev) =>
      prev.map((item, idx) => (idx === 0 ? { ...item, reply, isVerbSuggestion } : item))
    );

    setQuestion('');
    await playReplySound();
    setIsLoading(false);
  };

  const showToast = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else alert(message);
  };

  const handleSave = async (text) => {
    try {
      const existing = await AsyncStorage.getItem('savedAnswers');
      const saved = existing ? JSON.parse(existing) : [];

      const newEntry = { id: Date.now(), text, timestamp: new Date().toISOString() };
      await AsyncStorage.setItem('savedAnswers', JSON.stringify([newEntry, ...saved]));

      showToast(translations[lang]?.saved || translations.english.saved);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToast(translations[lang]?.errorSave || translations.english.errorSave);
    }
  };

  return (
    <>
      {visible && (
        <Modal
          visible={visible}
          animationType="slide"
          transparent={Platform.OS === 'android'}
          presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
          onRequestClose={async () => {
            if (blockModalCloseRef?.current) return;
            onClose?.();
          }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.screen}>
              <View style={styles.sheet}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
                  <Image source={require('../VERBIFY.png')} style={styles.logo} />
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => setSavedModalVisible(true)}
                      style={styles.iconButton}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Image source={require('../save2.png')} style={styles.iconImage} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onClose?.()}
                      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    >
                      <Ionicons name="close" size={36} color="#003366" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* BODY */}
                <View style={styles.body}>
                  <ScrollView
                    key={scrollKey}
                    ref={scrollViewRef}
                    style={styles.chat}
                    contentContainerStyle={[
                      styles.chatContent,
                      { paddingBottom: 118 + insets.bottom }, // запас под док + safe area
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    scrollEventThrottle={16}
                  >
                    {history.map((item, index) => (
                      <View key={index} style={styles.messageBlock}>
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

                        <View style={styles.answerBubble}>
                          {item.reply ? (
                            <FadeInView>
                              <>
                                <View style={styles.botHeader}>
                                  <View style={styles.botIconWrapper}>
                                    <Image source={require('../AI2.png')} style={styles.botIcon} />
                                  </View>
                                </View>

                                <StyledMarkdown>{String(item.reply)}</StyledMarkdown>

                                {index === 0 && item.isVerbSuggestion && verbContext ? (
                                  <TouchableOpacity
                                    style={styles.extraButton}
                                    onPress={() =>
                                      handleAskAuto(
                                        (conjugateCommand[lang] || conjugateCommand.english)(verbContext)
                                      )
                                    }
                                  >
                                    <Text style={styles.extraButtonText} maxFontSizeMultiplier={1.2}>
                                      {conjugateButtonLabels[lang] || conjugateButtonLabels.english}
                                    </Text>
                                  </TouchableOpacity>
                                ) : null}

                                {!item.isWelcome ? (
                                  <View style={styles.shareWrapper}>
                                    <TouchableOpacity
                                      onPress={() => handleSave(item.reply)}
                                      style={[styles.saveButton, { marginRight: 12 }]}
                                      activeOpacity={0.8}
                                    >
                                      <Image source={require('../save1.png')} style={styles.saveIcon} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      onPress={() => copyAnswer(item.reply)}
                                      style={[styles.copyButton, { marginRight: 12 }]}
                                      activeOpacity={0.8}
                                    >
                                      <Ionicons name="copy" size={22} color="#003366" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      onPress={() => shareAnswerOutsideModal(item.reply, null, blockModalCloseRef)}
                                      style={styles.shareButton}
                                      activeOpacity={0.8}
                                    >
                                      <Image source={require('../share.png')} style={styles.shareIcon} />
                                    </TouchableOpacity>
                                  </View>
                                ) : null}

                                {item.isWelcome && quickQuestions?.length ? (
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
                                ) : null}
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
                    ))}
                  </ScrollView>

                  {/* Ввод — максимально низко: убрали лишние padding снизу */}
                  <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
                    <View style={styles.inputDock}>
                      <View style={styles.inputRow}>
                        <TextInput
                          value={question}
                          onChangeText={setQuestion}
                          placeholder={t.placeholder}
                          style={[
                            styles.input,
                            isLoading && styles.inputDisabled,
                            (lang === 'العربية' || lang === 'עברית' || lang === 'አማርኛ') && {
                              paddingLeft: 60,
                              paddingRight: 44,
                              textAlign: 'right',
                            },
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
                  </SafeAreaView>
                </View>
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
  screen: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.35)' : '#F6F8FB',
    justifyContent: 'center',
  },

  sheet: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    ...(Platform.OS === 'android'
      ? { marginHorizontal: 10, marginVertical: 26, borderRadius: 16, overflow: 'hidden' }
      : { borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' }),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D1E3F1',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },

  logo: { width: 72, height: 72, resizeMode: 'contain', marginLeft: 5 },
  iconButton: { padding: 4, marginHorizontal: 4 },
  iconImage: { width: 36, height: 36, resizeMode: 'contain' },

  body: { flex: 1, position: 'relative' },

  chat: { flex: 1, marginTop: 10 },
  chatContent: { paddingHorizontal: 12 },

  messageBlock: { marginBottom: 20, alignSelf: 'center', width: '100%', maxWidth: 700 },

  questionBubble: {
    backgroundColor: '#D1E3F1',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },

  answerBubble: {
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'stretch',
    width: '100%',
  },

  labelTag: { alignSelf: 'flex-start', marginBottom: 4 },
  labelText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#003366',
    borderRadius: 6,
    overflow: 'hidden',
  },
  userQuestion: { color: '#003366', fontWeight: 'bold', fontSize: 15, marginTop: 8, marginBottom: 5 },

  botHeader: { width: '100%', justifyContent: 'center', height: 30, marginBottom: 4 },
  botIconWrapper: {
    backgroundColor: '#D1E3F1',
    borderRadius: 8,
    width: 65,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  botIcon: { width: 70, height: 70, resizeMode: 'contain' },
  botIconSmall: { width: 64, height: 64, resizeMode: 'contain' },

  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
    maxWidth: '85%',
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
  },
  loadingText: { fontStyle: 'italic', color: '#888', fontSize: 12, marginLeft: 6 },

  extraButton: {
    marginTop: 10,
    backgroundColor: '#dce7f5',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  extraButtonText: { fontSize: 15, color: '#003366', fontWeight: '600' },

  shareWrapper: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },

  shareButton: { backgroundColor: '#f0f0f0', borderRadius: 20, padding: 8, elevation: 3 },
  shareIcon: { width: 20, height: 20, resizeMode: 'contain' },

  saveButton: { padding: 6, backgroundColor: '#f0f0f0', borderRadius: 20, elevation: 2 },
  saveIcon: { width: 24, height: 24, resizeMode: 'contain' },

  copyButton: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 20, elevation: 2 },

  quickQuestionsWrapper: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  quickButton: {
    backgroundColor: '#dce7f5',
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: '42%',
    alignItems: 'center',
  },
  quickButtonText: { fontSize: 14, fontWeight: '700', color: '#003366', textAlign: 'center' },

  // ключ: панель прибита к низу модалки, без лишнего paddingBottom
  inputSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F6F8FB',
  },

  inputDock: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2, // ✅ меньше воздуха, ближе к границе модалки
    borderTopWidth: 1,
    borderColor: '#E3E7ED',
    marginBottom: 10
  },

  inputRow: { position: 'relative' },

  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingRight: 48,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },

  inputDisabled: { backgroundColor: '#e4e4e4', color: '#999' },

  sendButton: {
    position: 'absolute',
    right: 10,
    top: 8,
  },
});

export default ChatBotModal;
