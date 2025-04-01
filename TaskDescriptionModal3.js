import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TaskDescriptionModal6 = ({ visible, onToggle }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onToggle}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>В этом упражнении вам представлены более чем 250 часто употребляемымых глаголов на иврите, и ваша задача — определить, к какому биньяну относится каждый глагол из предложенных вариантов. 





</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Это упражнение помогает лучше понять структуру ивритских глаголов и углубляет знания о глагольных шаблонах, что важно для правильного использования глаголов в речи. Регулярное выполнение таких заданий повышает вашу грамматическую осведомленность и способствует более грамотному общению на иврите.




</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>Закрыть</Text>
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
  modalText: {
    marginBottom: 12,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    padding: 14,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }
});

export default TaskDescriptionModal6;
