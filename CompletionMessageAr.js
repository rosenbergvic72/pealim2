import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Импортируем для навигации

const CompletionMessageAr = ({
  correctAnswers, 
  incorrectAnswers, 
  handleOK, 
  correctAnswersPercentage, 
  grade,
  restartTask
}) => {
  const navigation = useNavigation(); // Используем хук для получения доступа к навигации

  return (
    <View style={styles.overlay}>
      <View style={styles.messageContainer}>
        <Text style={styles.completedMessage} maxFontSizeMultiplier={1.2}>تم إكمال التمرين!</Text>
        <Text style={styles.text1} maxFontSizeMultiplier={1.2}>
        إجابات صحيحة
        </Text>
        <Text style={styles.text2} maxFontSizeMultiplier={1.2}>
          {correctAnswersPercentage}%
        </Text>
        <Text style={styles.text} maxFontSizeMultiplier={1.2}>
          {grade}
        </Text>
        
        {/* Кнопка для продолжения упражнения */}
        <TouchableOpacity onPress={restartTask}>
          <Text style={styles.continueButton} maxFontSizeMultiplier={1.2}>استمر</Text>
        </TouchableOpacity>
    
        <TouchableOpacity onPress={() => {
          handleOK();
          navigation.navigate('MenuAr'); // Направляем на экран MenuEn
        }}>
          <Text style={styles.completeButton} maxFontSizeMultiplier={1.2}>القائمة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: '#FFF0E4',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  completedMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F4766',
    marginBottom: 10,
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    color: '#2F4766',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  text1: {
    fontSize: 16,
    color: '#2F4766',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  text2: {
    fontSize: 28,
    color: '#FA6559',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  completeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    textAlign: 'center',
    padding: 15,
  },
  continueButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    textAlign: 'center',
    padding: 15,
    marginBottom: 10,
  },
});

export default CompletionMessageAr;
