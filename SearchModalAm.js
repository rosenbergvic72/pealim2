import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';
import verbsData from './verbs6RU.json';

const SearchModalAm = ({ visible, onToggle, onSelectVerb }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');      // очищаем строку поиска
      setSearchResults([]);    // очищаем результаты при открытии
    }
  }, [visible]);

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setSearchResults([]);
      return;
    }

    const lowerCaseQuery = trimmed.toLowerCase();
    const results = verbsData.filter((verb) =>
      verb.infinitive.toLowerCase().includes(lowerCaseQuery) ||
      verb.amharic.toLowerCase().includes(lowerCaseQuery) ||
      verb.amtext.toLowerCase().includes(lowerCaseQuery) ||
      verb.translit.toLowerCase().includes(lowerCaseQuery) ||
      verb.transliteration.toLowerCase().includes(lowerCaseQuery) ||
      verb.hebrewtext.toLowerCase().includes(lowerCaseQuery)
    );
    setSearchResults(results);
  };

  const handleInputChange = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setSearchResults([]);
    }
  };

  const handleResultPress = (result) => {
    onSelectVerb(result); // вызывает handleSelectVerb снаружи
  };

  const handleSearchPress = () => {
    Keyboard.dismiss();
    handleSearch();
  };

  const handleBlur = () => {
    if (searchQuery.trim().length >= 3) {
      handleSearch();
    }
  };

  const isSearchEnabled = searchQuery.trim().length >= 3;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onToggle}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            በልምምድ ፈልግ
          </Text>

          <TextInput
            style={styles.input}
            placeholder="ለመፈለግ ቃል ያስገቡ"
            onChangeText={handleInputChange}
            value={searchQuery}
            onBlur={handleBlur}
            maxFontSizeMultiplier={1.2}
          />

          <TouchableOpacity
            style={[styles.button, !isSearchEnabled && styles.buttonDisabled]}
            onPress={handleSearchPress}
            disabled={!isSearchEnabled}
          >
            <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
              ፈልግ
            </Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
          >
            {searchResults.length > 0 && (
              <Text style={styles.hintText} maxFontSizeMultiplier={1.2}>
                ለማጣመር ጠቅ ያድርጉ
              </Text>
            )}

            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resultContainer}
                onPress={() => handleResultPress(result)}
              >
                {/* верхний блок — инфинитив + амхарский перевод + основная транслит */}
                <Text
                  style={[styles.resultTextBase, styles.infinitiveText]}
                  maxFontSizeMultiplier={1.2}
                >
                  {result.infinitive}
                </Text>

                <Text
                  style={[styles.resultTextBase, styles.amharicShortText]}
                  maxFontSizeMultiplier={1.2}
                >
                  {result.amharic}
                </Text>

                <Text
                  style={[styles.resultTextBase, styles.translitMainText]}
                  maxFontSizeMultiplier={1.2}
                >
                  {result.transliteration}
                </Text>

                {/* нижний блок — 3 строки, другие цвета и выравнивание вправо */}
                <Text
                  style={[styles.resultTextBase, styles.resultTextHebrew]}
                  maxFontSizeMultiplier={1.2}
                >
                  {result.hebrewtext}
                </Text>

                <Text
                  style={[styles.resultTextBase, styles.amharicPhraseText]}
                  maxFontSizeMultiplier={1.2}
                >
                  {result.amtext}
                </Text>

                <Text
                  style={[styles.resultTextBase, styles.translitAltText]}
                  maxFontSizeMultiplier={1.2}
                >
                  {result.translit}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onToggle}
          >
            <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.2}>
              ዝጋ
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 0,
    backgroundColor: '#FFFDEF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '94%',
    maxHeight: '94%',
  },
  modalText: {
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
    color: '#2B3270',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#C3C3C3',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'center',
  },
  button: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9CA9B5',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  resultsScroll: {
    width: '100%',
    flexGrow: 0,
  },
  resultsContent: {
    paddingBottom: 8,
  },

  hintText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B3270',
    textAlign: 'center',
    marginBottom: 6,
  },

  resultContainer: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C3D1E0',
    backgroundColor: '#E4ECF5',
    marginBottom: 6,
  },

  // базовый стиль для всех строк
  resultTextBase: {
    fontSize: 14,
    color: '#333',
    marginBottom: 1,
  },

  // верхние 3 строки
  infinitiveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3F60',
  },
  amharicShortText: {
    fontWeight: '600',
    color: '#1C3F60',
  },
  translitMainText: {
    fontStyle: 'italic',
    color: '#FF5733',
  },

  // нижние 3 строки — прижаты вправо и с другими цветами
  resultTextHebrew: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  amharicPhraseText: {
    fontWeight: '500',
    color: '#0B7285',
    textAlign: 'right',
  },
  translitAltText: {
    fontStyle: 'italic',
    color: '#B23A48',
    textAlign: 'right',
  },

  closeButton: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchModalAm;
