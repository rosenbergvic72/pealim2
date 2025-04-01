import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard } from 'react-native';
import verbsData from './verbs6RU.json';

const SearchModalAm = ({ visible, onToggle, onSelectVerb }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');  // Очищаем строку поиска при каждом открытии модального окна
      setSearchResults([]);  // Очищаем результаты поиска при каждом открытии модального окна
    }
  }, [visible]);

  const handleSearch = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = verbsData.filter(verb => 
      verb.infinitive.toLowerCase().includes(lowerCaseQuery) || 
      verb.amharic.toLowerCase().includes(lowerCaseQuery) ||
      verb.amtext.toLowerCase().includes(lowerCaseQuery) ||
      verb.translit.toLowerCase().includes(lowerCaseQuery) || 
      verb.transliteration.toLowerCase().includes(lowerCaseQuery)
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
    onSelectVerb(result);
    onToggle();
  };

  const handleSearchPress = () => {
    Keyboard.dismiss();
    handleSearch();
  };

  const handleBlur = () => {
    handleSearch();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onToggle}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>በልምምድ ፈልግ</Text>
          <TextInput
            style={styles.input}
            placeholder="የቦታ ያዥ፡ ለመፈለግ ቃል ያስገቡ"
            onChangeText={handleInputChange}
            value={searchQuery}
            onBlur={handleBlur} maxFontSizeMultiplier={1.2}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSearchPress}
          >
            <Text style={styles.buttonText}maxFontSizeMultiplier={1.2}>ፈልግ</Text>
          </TouchableOpacity>
          <ScrollView>
            {searchResults.length > 0 && (
              <Text style={styles.hintText}maxFontSizeMultiplier={1.2}>ለማጣመር ጠቅ ያድርጉ</Text>
            )}
            {searchResults.map((result, index) => (
              <TouchableOpacity key={index} style={styles.resultContainer} onPress={() => handleResultPress(result)}>
                <Text style={[styles.resultText, styles.infinitiveText]}maxFontSizeMultiplier={1.2}>{result.infinitive}</Text>
                <Text style={[styles.resultText1, { color: '#1C3F60' }]}maxFontSizeMultiplier={1.2}>{result.amharic}</Text>
                <Text style={[styles.resultText, { color: '#FF5733' }]}maxFontSizeMultiplier={1.2}>{result.transliteration}</Text>
                <Text style={[styles.resultText1, { color: '#1C3F60' }]}maxFontSizeMultiplier={1.2}>{result.amtext}</Text>
                <Text style={[styles.resultText, { color: '#FF5733' }]}maxFontSizeMultiplier={1.2}>{result.translit}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onToggle}
          >
            <Text style={styles.closeButtonText}maxFontSizeMultiplier={1.2}>ዝጋ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: '#FFFDEF',
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
    maxHeight: '80%'
  },
  modalText: {
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: "center",
    fontSize: 18,
    color: '#2B3270'
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    backgroundColor: '#AFC1D0',
    marginBottom: 10,
    borderRadius: 10
  },

  hintText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B3270',
    textAlign: 'center',
    marginBottom: 10
  },

  infinitiveText: {
    color: '#1C3F60',
    fontSize: 18,
    fontWeight: 'bold',
  },

  resultText1: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },

  closeButton: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default SearchModalAm;
