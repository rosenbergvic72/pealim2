import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';




const CompletionMessage = ({
  correctAnswers, 
  incorrectAnswers, 
  handleOK, 
  navigateToMenu, 
  correctAnswersPercentage, 
  grade,
  // restartTask={restartCurrentExercise}
  restartTask
  
}) => {
    return (
      <View style={styles.overlay}>
        <View style={styles.messageContainer}>
          <Text style={styles.completedMessage}maxFontSizeMultiplier={1.2}>Упражнение завершено!</Text>
          <Text style={styles.text1}maxFontSizeMultiplier={1.2}>
            Правильных ответов 
          </Text>
          <Text style={styles.text2}maxFontSizeMultiplier={1.2}>
            {correctAnswersPercentage}%
          </Text>
          <Text style={styles.text}maxFontSizeMultiplier={1.2}>
            {grade}
          </Text>
          
          {/* Adding new button for restarting the task */}
          <TouchableOpacity onPress={restartTask}>
  <Text style={styles.continueButton}maxFontSizeMultiplier={1.2}>ПРОДОЛЖИТЬ</Text>
</TouchableOpacity>

          <TouchableOpacity onPress={() => {
            handleOK();
            navigateToMenu();
          }}>
            <Text style={styles.completeButton}maxFontSizeMultiplier={1.2}>МЕНЮ</Text>
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
    // backgroundColor: 'white',
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
  continueButton: {  // Styling for the new Continue button
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#1C3F60',  // Different color to distinguish from OK button
    borderRadius: 10,
    textAlign: 'center',
    padding: 15,
    marginBottom: 10,  // Added margin-bottom for spacing between buttons
  },
});

export default CompletionMessage;
