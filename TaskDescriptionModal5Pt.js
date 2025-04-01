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
        <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>
        DESCRIÇÃO DO EXERCÍCIO 4
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Neste exercício, você verá um comando ou pedido expresso com um verbo no imperativo, juntamente com uma imagem de uma pessoa ou um grupo de pessoas a quem o comando é dirigido (homem, mulher ou grupo). Sua tarefa é escolher a forma correta do imperativo em hebraico entre quatro opções apresentadas.

</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Mesmo com um conhecimento mínimo deste tema, a prática regular ajudará você a reconhecer naturalmente os padrões de formação do imperativo em hebraico. Este método de treinamento permite memorizar rapidamente as formas corretas, desenvolver uma compreensão intuitiva da gramática e aprimorar sua capacidade de usar o idioma em situações reais.

</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>Fechar</Text>
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

export default TaskDescriptionModal4;
