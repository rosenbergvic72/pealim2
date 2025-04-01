import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal7 = ({ visible, onToggle }) => {
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
        ОПИСАНИЕ ЗАДАНИЯ 8
      </Text>

            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            Это продвинутое упражнение, предназначенное для тех, кто уже успешно справляется с заданиями в упражнениях 5 и 6. Оно аналогично упражнению 6, но теперь в течение одного раунда необходимо спрягать не один глагол, а случайно выбранные глаголы из всей базы.
            </Text>
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            В каждом раунде случайным образом выбираются глаголы в одной из глагольных форм на иврите. Ваша задача — выбрать правильный перевод на выбранном языке из 6 предложенных вариантов.
            </Text>
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            Это упражнение предназначено для продвинутых учеников, хорошо знакомых со спряжением глаголов в иврите. Оно помогает развить автоматизм, улучшить скорость восприятия и подбора правильных форм, а также глубже понять закономерности спряжения в различных биньянах.
            </Text>
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            Регулярное выполнение упражнения способствует глубокому усвоению системы спряжения глаголов, повышает уверенность в использовании ивритских глаголов и значительно улучшает грамматическую интуицию.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onToggle}>
            <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>Закрыть</Text>
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

export default TaskDescriptionModal7;
