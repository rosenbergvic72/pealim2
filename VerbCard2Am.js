// VerbCard2.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TypewriterTextLTR from './TypewriterTextLTR';

const VerbCard2Am = ({ verbData }) => {
  return (
    <View style={styles.cardContainer}>
      {/* <Text style={styles.verbText}>{verbData.verbRussian}</Text> */}
      <TypewriterTextLTR text={verbData.verbAmharic} typingSpeed={40} style={styles.verbRussian}maxFontSizeMultiplier={1.2}/>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 5,
    height: 70,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#D1E3F1',
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
    // borderColor: 'gray',
    // borderWidth: 1,
  },
  verbRussian: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#152039',
    textAlign: 'center',
  },
});

export default VerbCard2Am;
