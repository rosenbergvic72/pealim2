import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import { Animated } from 'react-native';

const VerbCard6 = ({ verbData, onAnswer }) => {
  const [sound, setSound] = useState();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async (audioFileName) => {
    try {
      const fileNameKey = audioFileName.replace('.mp3', '');
      const audioFile = sounds[fileNameKey];
      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }
      await sound?.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };

  const handlePress = () => {
    onAnswer(true); // Поскольку каждый вопрос связан с ответом, предполагаем, что он верный
  };

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.hebrewVerbContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 }]}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{verbData.infinitive}</Text>
        <Text style={[styles.translit]}>{verbData.transliteration}</Text>
        <Text style={[styles.bin]}>{verbData.russian}</Text>
        <TouchableOpacity onPress={() => playAudio(verbData.audioFile)} style={styles.audioButton}>
          <Image source={require('./speaker3.png')} style={styles.audioIcon} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handlePress} style={styles.optionButton}>
        {/* <Text style={styles.optionText}>{verbData.hebrewtext}</Text> */}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    // borderWidth: 5,
    // borderColor: 'blue',
    borderRadius: 10,
    marginBottom: 20,
    // padding: 10,
    // backgroundColor: '#F3F6FA',
    backgroundColor: '#FFFDEF',
    
  },
//   hebrewVerbContainer: {
//     alignItems: 'center',
//   },
  hebrewVerb: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333652',
    // backgroundColor: 'white',
    // color: 'white',
    // backgroundColor: '#333652',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },

  text: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333652',
    // backgroundColor: 'white',
    // color: 'white',
    // backgroundColor: '#333652',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },

  translit:{
    fontSize: 18,
    // fontWeight: 'bold',
    color: '#CE6857',
    // backgroundColor: 'white',
    // color: 'white',
    // backgroundColor: '#333652',
    // borderRadius: 20,
    // paddingLeft: 10,
    // paddingRight: 10,
    // marginBottom: 5,
  },

  root:{
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7031',
    // backgroundColor: 'white',
    // color: 'white',
    // backgroundColor: '#333652',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },

  bin:{
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003882',
    // backgroundColor: 'white',
    // color: 'white',
    // backgroundColor: '#333652',
    // borderRadius: 20,
    // paddingLeft: 10,
    // paddingRight: 10,
    // marginBottom: 15,
  },

  audioButton: {
    // marginTop: 10,
    // position: 'absolute',
    // right: 5,
    // bottom: 5,
    top: 1
    // backgroundColor: 'black',
    // width: '50',
  
  },
  audioIcon: {
    width: 22,
    height: 22,
    // marginTop: 10,
    // marginBottom: 10,
    // backgroundColor: 'black',
    borderRadius: 10,
  },
  // optionsContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginTop: 10,
  // },
  // optionButton: {
  //   width: '48%',
  //   height: 60,
  //   padding: 15,
  //   borderWidth: 1,
  //   borderColor: 'gray',
  //   borderRadius: 5,
  //   backgroundColor: 'white',
  //   marginBottom: 10,
  // },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VerbCard6;
