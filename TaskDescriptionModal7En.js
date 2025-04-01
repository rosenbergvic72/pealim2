import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal7En = ({ visible, onToggle }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onToggle}
    >
      <View style={styles.centeredView}>
      <View style={styles.modalView}>
  <ScrollView contentContainerStyle={styles.scrollViewContent}>

    <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>
      TASK 8 DESCRIPTION
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      This is an advanced exercise designed for those who have successfully completed tasks in Exercises 5 and 6. It is similar to Exercise 6, but now, instead of conjugating just one verb per round, you will need to conjugate randomly selected verbs from the entire database.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      In each round, verbs in one of the conjugated forms in Hebrew are randomly selected. Your task is to choose the correct translation in the selected language from 6 given options.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      This exercise is intended for advanced learners who are well-acquainted with Hebrew verb conjugation. It helps develop automaticity, improve recognition speed and accuracy, and deepen understanding of conjugation patterns across different binyanim.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Regular practice of this exercise contributes to a deep mastery of the Hebrew verb system, increases confidence in using Hebrew verbs, and significantly enhances grammatical intuition.
    </Text>
  </ScrollView>
  <TouchableOpacity style={styles.button} onPress={onToggle}>
    <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>Close</Text>
  </TouchableOpacity>
</View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingTop: 10, // отступ от статус-бара
    paddingBottom: 10,
  },
  modalView: {
    maxHeight: "90%",
    margin: 24,
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingBottom: 10
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  modalText: {
    marginBottom: 8,
    fontSize: 14,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#2D4769",
    borderRadius: 10,
    padding: 14,
    elevation: 2,
    marginTop: 20
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }
});

export default TaskDescriptionModal7En;
