import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Image, 
  TextInput,
  Button,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askChatGPT } from '../api/chatgptService';
import StyledMarkdown from './StyledMarkdown';
import { Ionicons } from '@expo/vector-icons';

const ChatBotModal = ({ visible, onClose }) => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [lang, setLang] = useState('русский');
  const scrollViewRef = useRef(null);

  const [username, setUsername] = useState('');  

  useEffect(() => {
    const loadUserName = async () => {
      const storedName = await AsyncStorage.getItem('name');
      if (storedName) {
        setUsername(storedName);
      }
    };
    loadUserName();
  }, [visible]);

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      if (storedLang) setLang(storedLang);
    };
    loadLanguage();
  }, [visible]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [history]);

  const translations = {
    русский: {
      ask: 'Спросить',
      close: 'Закрыть',
      placeholder: 'Спроси про глагол...',
      you: 'Вы',
      bot: 'Бот',
    },
    english: {
      ask: 'Ask',
      close: 'Close',
      placeholder: 'Ask about a Hebrew verb...',
      you: 'You',
      bot: 'Bot',
    },
    français: {
      ask: 'Demander',
      close: 'Fermer',
      placeholder: 'Demande un verbe hébreu...',
      you: 'Vous',
      bot: 'Bot',
    },
    español: {
      ask: 'Preguntar',
      close: 'Cerrar',
      placeholder: 'Pregunta sobre un verbo hebreo...',
      you: 'Tú',
      bot: 'Bot',
    },
    português: {
      ask: 'Perguntar',
      close: 'Fechar',
      placeholder: 'Pergunte sobre um verbo hebraico...',
      you: 'Você',
      bot: 'Bot',
    },
    العربية: {
      ask: 'اسأل',
      close: 'إغلاق',
      placeholder: 'اسأل عن فعل عبري...',
      you: 'أنت',
      bot: 'بوت',
    },
    አማርኛ: {
      ask: 'ጠይቅ',
      close: 'ዝጋ',
      placeholder: 'ስለ የዕብራይስጥ ግስ ጠይቅ...',
      you: 'አንተ',
      bot: 'ቦት',
    },
  };
  

  const t = translations[lang] || translations['русский'];

  const handleAsk = async () => {
    if (!question.trim()) return;
    Keyboard.dismiss();
    const formattedHistory = history
      .slice(0, 3)
      .flatMap(item => [
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.reply },
      ]);

    const reply = await askChatGPT(question, formattedHistory);
    setHistory([{ question, reply }, ...history]);
    setQuestion('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.header}>
  <Image source={require('../VERBIFY.png')} style={styles.logo} />
  <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
    <Ionicons name="close" size={36} color="gray" />
  </TouchableOpacity>
</View>


        <ScrollView
          ref={scrollViewRef}
          style={styles.chat}
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {history.map((item, index) => {
            const isLast = index === 0;
            return (
              <View
                key={index}
                style={[styles.messageBlock, isLast && styles.highlightMessage]}
              >
                <View style={styles.questionBubble}>
                <View style={styles.labelTag}>
                <Text style={styles.labelText}>{username || t.you}</Text>

</View>
                  <Text style={styles.userQuestion}>{item.question}</Text>
                </View>

                <View style={styles.answerBubble}>
  <View style={styles.botHeader}>
    {/* <Image source={require('../AI2.png')} style={styles.botIcon} /> */}
    <View style={styles.botIconWrapper}>
  <Image source={require('../AI2.png')} style={styles.botIcon} />
</View>
  </View>
  <StyledMarkdown>{item.reply}</StyledMarkdown>
</View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputWrapper}>
  <TextInput
    value={question}
    onChangeText={setQuestion}
    placeholder={t.placeholder}
    style={styles.inputWithButton}
    multiline
  />
  <TouchableOpacity onPress={handleAsk} style={styles.sendButton}>
    <Ionicons name="arrow-up-circle" size={36} color="#4A6491" />
  </TouchableOpacity>
</View>


      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: 'white' },
  closeIcon: {
    padding: 5,
    marginTop: Platform.OS === 'ios' ? 0 : -4, // чуть выше
  },
  chat: { flex: 1, marginTop: 10 },
  messageBlock: { marginBottom: 20 },
  highlightMessage: {
    backgroundColor: '#EEF3FB',
    borderColor: '#4A6491',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
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
    padding: 10,
    // alignSelf: 'flex-start',
    // maxWidth: '100%',
    width: '100%',
  },

  labelTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#6C8EBB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },

  labelText: {
    fontWeight: 'bold',
    // color: '#bd462a',
    color: 'white',
    fontSize: 16,
    // marginBottom: 5,
  },
  userQuestion: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 15,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,  // максимально вверх
    paddingBottom: 6,
    backgroundColor: 'white',
    // zIndex: 10,
    height: 40,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  closeIcon: {
    // padding: 5,
  },
  chat: {
    flex: 1,
    marginTop: 10,
  },
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
  sendButton: {
    marginLeft: 8,
  },
  inputWrapper: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
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
});

export default ChatBotModal;
