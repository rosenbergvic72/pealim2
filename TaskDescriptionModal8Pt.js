import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal8Pt = ({ visible, onToggle }) => {
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
    DESCRIÇÃO DO EXERCÍCIO 6
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Este exercício é semelhante ao Exercício 5, também é um dos exercícios principais do aplicativo e foi desenvolvido para treinar de forma eficaz a conjugação dos verbos em hebraico.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Em cada rodada, um verbo em hebraico é selecionado aleatoriamente, e você deve encontrar o par correto para uma de suas formas conjugadas. Serão exibidas sequencialmente 36 (ou 24) formas verbais conjugadas em hebraico, e sua tarefa é escolher a tradução correta no idioma selecionado entre as 6 opções oferecidas.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Este exercício é recomendado para aqueles que já estudam hebraico e possuem pelo menos um conhecimento básico da conjugação dos verbos. Mesmo com um conhecimento mínimo do tema, a prática regular ajudará a memorizar melhor as formas de conjugação, identificar padrões e reforçá-los com a prática.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    O treinamento contínuo contribui para uma compreensão mais profunda do sistema verbal hebraico, o desenvolvimento da intuição gramatical e a melhoria das habilidades de compreensão do hebraico.
  </Text>
 </ScrollView>

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

export default TaskDescriptionModal8Pt;
