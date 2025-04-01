import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal8En = ({ visible, onToggle }) => {
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
    TASK 6 DESCRIPTION
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    This exercise is similar to Task 5, is also one of the main exercises in the app, and is designed for effective Hebrew verb conjugation training.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    In each round, a Hebrew verb is randomly selected, and you must find the correct pair for one of its conjugated forms. A total of 36 (or 24) conjugated verb forms in Hebrew will be displayed sequentially, and your task is to choose the correct translation in the selected language from 6 given options.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    This exercise is recommended for those who are already studying Hebrew and have at least basic knowledge of verb conjugation. Even with minimal understanding of the topic, regular practice will help you better memorize conjugation forms, recognize patterns, and reinforce them through practice.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Consistent training contributes to a deeper understanding of the Hebrew verb system, the development of intuitive grammatical awareness, and the improvement of Hebrew comprehension skills.
  </Text>
 </ScrollView>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>Close</Text>
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

export default TaskDescriptionModal8En;
