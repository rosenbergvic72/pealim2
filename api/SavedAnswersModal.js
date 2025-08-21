// SavedAnswersModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import StyledMarkdown from './StyledMarkdown';
// import { InteractionManager } from 'react-native';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { ToastAndroid } from 'react-native'; // для Android-уведомления

const SavedAnswersModal = ({ visible, onClose, blockModalCloseRef  }) => {
  const [savedAnswers, setSavedAnswers] = useState([]);
  const [filteredAnswers, setFilteredAnswers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lang, setLang] = useState('русский');
  const [isSharing, setIsSharing] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);


  const translations = {
    русский: {
      savedAnswersTitle: 'Сохранённые ответы',
      previewTitle: 'Сохранённый ответ',
      headerTitle: 'Хранилище',
      searchPlaceholder: 'Поиск...',
    },
    english: {
      savedAnswersTitle: 'Saved Answers',
      previewTitle: 'Saved Answer',
      headerTitle: 'Storage',
      searchPlaceholder: 'Search...',
    },
    français: {
      savedAnswersTitle: 'Réponses enregistrées',
      previewTitle: 'Réponse enregistrée',
      headerTitle: 'Stockage',
      searchPlaceholder: 'Recherche...',
    },
    español: {
      savedAnswersTitle: 'Respuestas guardadas',
      previewTitle: 'Respuesta guardada',
      headerTitle: 'Almacenamiento',
      searchPlaceholder: 'Buscar...',
    },
    português: {
      savedAnswersTitle: 'Respostas salvas',
      previewTitle: 'Resposta salva',
      headerTitle: 'Armazenamento',
      searchPlaceholder: 'Pesquisar...',
    },
    العربية: {
      savedAnswersTitle: 'الإجابات المحفوظة',
      previewTitle: 'الإجابة المحفوظة',
      headerTitle: 'التخزين',
      searchPlaceholder: 'بحث...',
    },
    አማርኛ: {
      savedAnswersTitle: 'የተቀመጡ መልሶች',
      previewTitle: 'የተቀመጠ መልስ',
      headerTitle: 'እቃ ማከማቻ',
      searchPlaceholder: 'ፈልግ...',
    },
  };

  const t = translations[lang] || translations.english;
  

  const stripMarkdown = (markdown) => {
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*>+/gm, '')
      .replace(/^-{3,}/g, '')
      .replace(/^\s*#+\s*(.*)/gm, '$1')
      .replace(/\|/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
  };

  const loadAnswers = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedAnswers');
      const parsed = stored ? JSON.parse(stored) : [];
      setSavedAnswers(parsed);
      setFilteredAnswers(parsed);
    } catch (error) {
      console.error('Ошибка загрузки сохранённых ответов:', error);
    }
  };

  const loadLang = async () => {
    const storedLang = await AsyncStorage.getItem('language');
    if (storedLang) setLang(storedLang);
  };

  useEffect(() => {
    if (visible) {
      loadLang();
      loadAnswers();
    }
  }, [visible]);

  const deleteAnswer = async (index) => {
    try {
      const updated = savedAnswers.filter((_, i) => i !== index);
      setSavedAnswers(updated);
      setFilteredAnswers(updated);
      await AsyncStorage.setItem('savedAnswers', JSON.stringify(updated));
    } catch (error) {
      console.error('Ошибка при удалении сохранённого ответа:', error);
    }
  };
  

 

  // const shareAnswer = async (text) => {
  //   try {
  //     if (blockModalCloseRef?.current !== undefined) {
  //       console.log('🔒 Блокируем закрытие ChatBotModal');
  //       blockModalCloseRef.current = true;
  //     }// ⛔ Блокируем закрытие
  
  //     const cleanedText = stripMarkdown(text);
  //     const path = `${FileSystem.cacheDirectory}answer.txt`;
  //     await FileSystem.writeAsStringAsync(path, cleanedText);
  
  //     await Sharing.shareAsync(path, {
  //       mimeType: 'text/plain',
  //       dialogTitle: t.shareTitle || 'Поделиться ответом',
  //     });
  //   } catch (error) {
  //     console.error('Ошибка при попытке поделиться:', error);
  //   } finally {
  //     setTimeout(() => {
  //       if (blockModalCloseRef?.current !== undefined) {
  //         blockModalCloseRef.current = false;
  //         console.log('✅ Разблокируем закрытие ChatBotModal');
  //       } // ✅ Разблокировка с задержкой
  //     }, 800);
  //   }
  // };
  
  const shareAnswer = async (text) => {
    try {
      if (blockModalCloseRef?.current !== undefined) {
        console.log('🔒 Блокируем закрытие ChatBotModal');
        blockModalCloseRef.current = true;
      }
  
      const cleanedText = stripMarkdown(text);
  
      await Share.share({
        message: cleanedText,
        title: t.shareTitle || 'Поделиться ответом',
      });
    } catch (error) {
      console.error('Ошибка при попытке поделиться:', error);
    } finally {
      setTimeout(() => {
        if (blockModalCloseRef?.current !== undefined) {
          blockModalCloseRef.current = false;
          console.log('✅ Разблокируем закрытие ChatBotModal');
        }
      }, 800);
    }
  };

  const copyAnswer = async (text) => {
    try {
      const cleanedText = stripMarkdown(text);
      await Clipboard.setStringAsync(cleanedText);
      ToastAndroid.show('Скопировано в буфер обмена', ToastAndroid.SHORT);
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const toggleFavorite = async (index) => {
    try {
      const updated = [...savedAnswers];
      updated[index].favorite = !updated[index].favorite;
      setSavedAnswers(updated);
      setFilteredAnswers(updated);
      await AsyncStorage.setItem('savedAnswers', JSON.stringify(updated));
    } catch (err) {
      console.error('Ошибка при обновлении избранного:', err);
    }
  };
  

  

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  // const t = {
  //   savedAnswersTitle: 'Сохранённые ответы',
  //   previewTitle: 'Сохранённый ответ',
  //   searchPlaceholder: 'Поиск...'
  // };

  return (
    <Modal
    visible={visible}
    animationType="slide"
    // transparent={true}
    onRequestClose={() => {
      if (!isSharing) onClose(); // НЕ закрывать модалку во время isSharing
    }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: '#F6F8FB' }}>
          {!selectedAnswer ? (
            <View style={{ flex: 1 }}>
              <View style={styles.previewHeader}>
                <Image source={require('../VERBIFY.png')} style={styles.logo} />
                {/* <Text style={styles.headerTitle}>{t.headerTitle}</Text> */}
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={36} color="#003366" />
                </TouchableOpacity>
              </View>
  
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8 }}>
  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
    {t.savedAnswersTitle}
  </Text>
  <TouchableOpacity onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}>
    <Ionicons
      name={showFavoritesOnly ? 'star' : 'star-outline'}
      size={24}
      color={showFavoritesOnly ? '#ff7925' : '#888'}
    />
  </TouchableOpacity>
</View>
  
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={22} color="#666" style={{ marginLeft: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={text => {
                    setSearchQuery(text);
                    const lower = text.toLowerCase();
                    setFilteredAnswers(
                      text.trim() ? savedAnswers.filter(a => a.text.toLowerCase().includes(lower)) : savedAnswers
                    );
                  }}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor="#aaa"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setFilteredAnswers(savedAnswers);
                    }}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {/* <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8 }}>
  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
    {t.savedAnswersTitle}
  </Text>
  <TouchableOpacity onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}>
    <Ionicons
      name={showFavoritesOnly ? 'star' : 'star-outline'}
      size={24}
      color={showFavoritesOnly ? 'ff7925' : '#888'}
    />
  </TouchableOpacity>
</View> */}

  
              <ScrollView contentContainerStyle={styles.listContainer}>
                {filteredAnswers
  .filter(a => !showFavoritesOnly || a.favorite)
  .map((item, i) => (
                  <View key={i} style={styles.answerBlock}>
                  <TouchableOpacity
                    style={styles.answerButton}
                    onPress={() => setSelectedAnswer(item)}
                  >
                    <Text style={styles.answerText} numberOfLines={3}>
                      {item.text.replace(/[#*_`>-]/g, '')}
                    </Text>
                    <Text style={styles.timestampInList}>{formatDate(item.timestamp)}</Text>
                  </TouchableOpacity>
                
                  <View style={styles.buttonRow}>

                      <TouchableOpacity onPress={() => toggleFavorite(i)} style={{ marginRight: 13 }}>
                      <Ionicons
                        name={item.favorite ? 'star' : 'star-outline'}
                        size={24}
                        color={item.favorite ? '#ff7925' : '#888'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => copyAnswer(item.text)}>
                      <Ionicons name="copy" size={24} color="#003366" />
                    </TouchableOpacity>
                
                    <TouchableOpacity onPress={() => shareAnswer(item.text)} style={{ marginLeft: 12 }}>
                      <Ionicons name="share-social" size={24} color="#003366" />
                    </TouchableOpacity>
                
                    <TouchableOpacity onPress={() => deleteAnswer(i)} style={{ marginLeft: 12 }}>
                      <Ionicons name="trash" size={24} color="#003366" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
            <View style={styles.previewHeader}>
  <Image source={require('../VERBIFY.png')} style={styles.logo} />

  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
    {selectedAnswer?.text && (
      <>

<TouchableOpacity onPress={() => {
      const index = savedAnswers.findIndex(a => a.timestamp === selectedAnswer.timestamp);
      toggleFavorite(index);
    }}>
      <Ionicons
        name={
          savedAnswers.find(a => a.timestamp === selectedAnswer.timestamp)?.favorite
            ? 'star'
            : 'star-outline'
        }
        size={24}
        color={
          savedAnswers.find(a => a.timestamp === selectedAnswer.timestamp)?.favorite
            ? '#ff7925'
            : '#888'
        }
      />
    </TouchableOpacity>

        <TouchableOpacity onPress={() => copyAnswer(selectedAnswer.text)}>
          <Ionicons name="copy" size={24} color="#003366" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => shareAnswer(selectedAnswer.text)}>
          <Image source={require('../share.png')} style={{ width: 20, height: 24, resizeMode: 'contain' }} />
        </TouchableOpacity>
      </>
    )}
    <TouchableOpacity onPress={() => setSelectedAnswer(null)}>
      <Ionicons name="close" size={36} color="#003366" />
    </TouchableOpacity>
  </View>
</View>

  
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <StyledMarkdown>{selectedAnswer.text}</StyledMarkdown>
                <Text style={styles.timestampPreview}>{formatDate(selectedAnswer.timestamp)}</Text>
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  previewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#D1E3F1', borderBottomWidth: 1, borderColor: '#ccc', height: 60,
  },
  previewTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366', textAlign: 'center',  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366', textAlign: 'center',  },
  logo: { width: 72, height: 72, resizeMode: 'contain', marginLeft: 5 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    margin: 12,
    borderRadius: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 8,
  },
  listContainer: { padding: 12 },
  answerBlock: { backgroundColor: '#FFFDEF', borderRadius: 10, padding: 12, marginBottom: 12 },
  answerText: { fontSize: 16, color: '#003366' },
  timestampInList: { marginTop: 6, fontSize: 12, color: '#888' },
  timestampPreview: { marginTop: 20, fontSize: 13, color: '#666', textAlign: 'center' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  answerButton: {
    flex: 1,
  },
  
});

export default SavedAnswersModal;
