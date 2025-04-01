import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal6En = ({ visible, onToggle }) => {
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
    TASK 5 DESCRIPTION
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
        This is the main exercise in the app, designed for effective Hebrew verb conjugation training.
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      In each round, a Hebrew verb is randomly selected, and you must find the correct pair for one of its conjugated forms. You will see 6 pairs out of a possible 36 (or 24), containing verb forms in Hebrew and their corresponding translations in the selected language. Your task is to match them correctly by first selecting an option in the left column and then its corresponding Hebrew form in the right column.
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
        This exercise is recommended for those who are already studying Hebrew and have at least a basic understanding of verb conjugation. Even with minimal knowledge of the topic, regular practice will help you better memorize conjugation forms, recognize patterns, and reinforce them through practice.
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
        Regular practice contributes to a deeper understanding of the Hebrew verb system, the development of intuitive grammatical awareness, and the improvement of Hebrew language comprehension skills.
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

export default TaskDescriptionModal6En;
