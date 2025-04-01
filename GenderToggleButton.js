import React, { useState } from 'react';
import { TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';

const GenderToggleButton = ({ fadeAnim }) => {
  const [gender, setGender] = useState('man');

  const toggleGender = () => {
    setGender((prevGender) => (prevGender === 'man' ? 'woman' : 'man'));
  };

  return (
    <TouchableOpacity onPress={toggleGender}>
      <Animated.Image
        source={gender === 'man' ? require('./GenderMan.png') : require('./GenderWoman.png')}
        style={[styles.buttonImage, { opacity: fadeAnim }]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10,
  },
});

export default GenderToggleButton;
