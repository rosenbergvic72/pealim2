import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TaskDescriptionModal4 = ({ visible, onToggle }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onToggle}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>В этом упражнении представлены примерно 100 наиболее распространеных глаголов иврита и для каждого глагола сгенерированы 36 пар фраз. Каждая пара соответствует одной из 36 форм спряжения глагола на иврите. Одна сторона пары — это фраза на русском, другая — на иврите. Ваша задача — выбрать правильные пары, где перевод точно соответствует форме глагола.

</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Выполняя это упражнение, вы улучшите свои навыки перевода и глубже поймёте, как использовать разные формы глаголов в речи. Это поможет вам лучше говорить и писать на иврите, делая ваше общение более естественным и точным.

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

export default TaskDescriptionModal4;
