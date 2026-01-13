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
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import StyledMarkdown from './StyledMarkdown';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SavedAnswersModal = ({ visible, onClose, blockModalCloseRef }) => {
  const insets = useSafeAreaInsets();

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
      shareTitle: 'Поделиться ответом',
      copied: 'Скопировано в буфер обмена',
    },
    english: {
      savedAnswersTitle: 'Saved Answers',
      previewTitle: 'Saved Answer',
      headerTitle: 'Storage',
      searchPlaceholder: 'Search...',
      shareTitle: 'Share answer',
      copied: 'Copied to clipboard',
    },
    français: {
      savedAnswersTitle: 'Réponses enregistrées',
      previewTitle: 'Réponse enregistrée',
      headerTitle: 'Stockage',
      searchPlaceholder: 'Recherche...',
      shareTitle: 'Partager la réponse',
      copied: 'Copié dans le presse-papiers',
    },
    español: {
      savedAnswersTitle: 'Respuestas guardadas',
      previewTitle: 'Respuesta guardada',
      headerTitle: 'Almacenamiento',
      searchPlaceholder: 'Buscar...',
      shareTitle: 'Compartir respuesta',
      copied: 'Copiado al portapapeles',
    },
    português: {
      savedAnswersTitle: 'Respostas salvas',
      previewTitle: 'Resposta salva',
      headerTitle: 'Armazenamento',
      searchPlaceholder: 'Pesquisar...',
      shareTitle: 'Compartilhar resposta',
      copied: 'Copiado para a área de transferência',
    },
    العربية: {
      savedAnswersTitle: 'الإجابات المحفوظة',
      previewTitle: 'الإجابة المحفوظة',
      headerTitle: 'التخزين',
      searchPlaceholder: 'بحث...',
      shareTitle: 'مشاركة الإجابة',
      copied: 'تم النسخ إلى الحافظة',
    },
    አማርኛ: {
      savedAnswersTitle: 'የተቀመጡ መልሶች',
      previewTitle: 'የተቀመጠ መልስ',
      headerTitle: 'እቃ ማከማቻ',
      searchPlaceholder: 'ፈልግ...',
      shareTitle: 'መልስ አጋራ',
      copied: 'ወደ ክሊፕቦርድ ተቀድቷል',
    },
  };

  const t = translations[lang] || translations.english;

  const stripMarkdown = (markdown) => {
    return (markdown || '')
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
    try {
      const storedLang = await AsyncStorage.getItem('language');
      if (storedLang) setLang(storedLang);
    } catch (e) {
      // ignore
    }
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

  const shareAnswer = async (text) => {
    try {
      setIsSharing(true);

      if (blockModalCloseRef?.current !== undefined) {
        console.log('🔒 Блокируем закрытие ChatBotModal');
        blockModalCloseRef.current = true;
      }

      const cleanedText = stripMarkdown(text);

      await Share.share({
        message: cleanedText,
        title: t.shareTitle,
      });
    } catch (error) {
      console.error('Ошибка при попытке поделиться:', error);
    } finally {
      setTimeout(() => {
        if (blockModalCloseRef?.current !== undefined) {
          blockModalCloseRef.current = false;
          console.log('✅ Разблокируем закрытие ChatBotModal');
        }
        setIsSharing(false);
      }, 800);
    }
  };

  const copyAnswer = async (text) => {
    try {
      const cleanedText = stripMarkdown(text);
      await Clipboard.setStringAsync(cleanedText);

      if (Platform.OS === 'android') {
        ToastAndroid.show(t.copied, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const toggleFavorite = async (index) => {
    try {
      if (index < 0) return;
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

  const closeThisModal = () => {
    if (isSharing) return; // не закрывать во время шаринга
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      // ✅ iOS: sheet (не во весь экран). Android: можно оставить как было.
      transparent={Platform.OS === 'android'}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={closeThisModal}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.sheet}>
            {!selectedAnswer ? (
              <View style={{ flex: 1 }}>
                {/* Header */}
                <View
                  style={[
                    styles.previewHeader,
                    { paddingTop: insets.top, height: 44 + insets.top },
                  ]}
                >
                  <Image source={require('../VERBIFY.png')} style={styles.logo} />
                  <TouchableOpacity
                    onPress={closeThisModal}
                    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  >
                    <Ionicons name="close" size={36} color="#003366" />
                  </TouchableOpacity>
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.title}>{t.savedAnswersTitle}</Text>
                  <TouchableOpacity
                    onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
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
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      const lower = text.toLowerCase();
                      setFilteredAnswers(
                        text.trim()
                          ? savedAnswers.filter((a) => (a.text || '').toLowerCase().includes(lower))
                          : savedAnswers
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
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView contentContainerStyle={styles.listContainer}>
                  {filteredAnswers
                    .filter((a) => !showFavoritesOnly || a.favorite)
                    .map((item, i) => (
                      <View key={i} style={styles.answerBlock}>
                        <TouchableOpacity
                          style={styles.answerButton}
                          onPress={() => setSelectedAnswer(item)}
                        >
                          <Text style={styles.answerText} numberOfLines={3}>
                            {(item.text || '').replace(/[#*_`>-]/g, '')}
                          </Text>
                          <Text style={styles.timestampInList}>{formatDate(item.timestamp)}</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonRow}>
                          <TouchableOpacity
                            onPress={() => toggleFavorite(i)}
                            style={{ marginRight: 13 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons
                              name={item.favorite ? 'star' : 'star-outline'}
                              size={24}
                              color={item.favorite ? '#ff7925' : '#888'}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => copyAnswer(item.text)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="copy" size={24} color="#003366" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => shareAnswer(item.text)}
                            style={{ marginLeft: 12 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="share-social" size={24} color="#003366" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => deleteAnswer(i)}
                            style={{ marginLeft: 12 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash" size={24} color="#003366" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </ScrollView>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Header Preview */}
                <View
                  style={[
                    styles.previewHeader,
                    { paddingTop: insets.top, height: 60 + insets.top },
                  ]}
                >
                  <Image source={require('../VERBIFY.png')} style={styles.logo} />

                  <View style={styles.previewActions}>
                    {selectedAnswer?.text ? (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            const index = savedAnswers.findIndex(
                              (a) => a.timestamp === selectedAnswer.timestamp
                            );
                            toggleFavorite(index);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons
                            name={
                              savedAnswers.find((a) => a.timestamp === selectedAnswer.timestamp)
                                ?.favorite
                                ? 'star'
                                : 'star-outline'
                            }
                            size={24}
                            color={
                              savedAnswers.find((a) => a.timestamp === selectedAnswer.timestamp)
                                ?.favorite
                                ? '#ff7925'
                                : '#888'
                            }
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => copyAnswer(selectedAnswer.text)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="copy" size={24} color="#003366" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => shareAnswer(selectedAnswer.text)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Image
                            source={require('../share.png')}
                            style={{ width: 20, height: 24, resizeMode: 'contain' }}
                          />
                        </TouchableOpacity>
                      </>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => setSelectedAnswer(null)}
                      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    >
                      <Ionicons name="close" size={36} color="#003366" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                  <StyledMarkdown>{selectedAnswer.text}</StyledMarkdown>
                  <Text style={styles.timestampPreview}>
                    {formatDate(selectedAnswer.timestamp)}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // общий фон (на Android transparent даст "подложку"; на iOS это просто фон внутри sheet)
  screen: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.35)' : '#F6F8FB',
    justifyContent: 'center',
  },

  // сам "лист" (на Android — имитируем модалку поверх; на iOS — просто контейнер внутри pageSheet)
  sheet: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    ...(Platform.OS === 'android'
      ? {
          marginHorizontal: 10,
          marginVertical: 26,
          borderRadius: 16,
          overflow: 'hidden',
        }
      : {
          // iOS pageSheet сам не edge-to-edge, но скругление внутри выглядит аккуратно
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
        }),
  },

  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D1E3F1',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    height: 30,
  },

  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginLeft: 5,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
  },

searchWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#e0e0e0',
  margin: 12,
  borderRadius: 10,
  height: 42,               // ✅ чуть комфортнее
  paddingHorizontal: 10,    // ✅ единые отступы
},


searchInput: {
  flex: 1,
  marginLeft: 8,             // ✅ отступ от иконки
  paddingVertical: 0,         // ✅ iOS: убирает “скачки”
  fontSize: 16,
  color: '#333',
  textAlignVertical: 'center' // ✅ Android: центрирование по вертикали
},


clearButton: {
  paddingLeft: 8,
  paddingRight: 2,
},

  listContainer: { padding: 12 },

  answerBlock: {
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

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
