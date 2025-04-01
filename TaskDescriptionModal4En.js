import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal4En = ({ visible, onToggle }) => {
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
      TASK 7 DESCRIPTION
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      This is an advanced exercise designed for those who have successfully completed tasks in Exercises 5 and 6. It is similar to Exercise 5, but now, instead of conjugating just one verb per round, you will need to conjugate randomly selected verbs from the entire database.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      In each round, 6 pairs of all possible verb forms will be displayed sequentially. Your task is to correctly match these forms in Hebrew with their corresponding translations in the selected language. As in Exercise 5, you first select an option from the left column and then its corresponding match in the right column.
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#2D4769",
    borderRadius: 10,
    padding: 14,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  }
});

export default TaskDescriptionModal4En;
