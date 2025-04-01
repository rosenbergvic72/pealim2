import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal4Pt = ({ visible, onToggle }) => {
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
      DESCRIÇÃO DO EXERCÍCIO 7
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Este é um exercício avançado, destinado a quem já domina as tarefas dos exercícios 5 e 6. Ele é semelhante ao exercício 5, mas agora, em vez de conjugar apenas um verbo por rodada, você precisará conjugar verbos selecionados aleatoriamente de toda a base de dados.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Em cada rodada, 6 pares de todas as formas verbais possíveis serão exibidos sequencialmente. Sua tarefa é combinar corretamente essas formas em hebraico com suas traduções correspondentes no idioma selecionado. Assim como no exercício 5, você primeiro seleciona uma opção na coluna esquerda e depois encontra sua correspondência na coluna direita.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Este exercício é recomendado para alunos avançados que já têm um bom conhecimento da conjugação dos verbos hebraicos. Ele ajuda a desenvolver a automatização, melhorar a velocidade e precisão na identificação das formas corretas e aprofundar a compreensão dos padrões de conjugação nos diferentes binyanim.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      A prática regular deste exercício contribui para um domínio profundo do sistema verbal hebraico, aumenta a confiança no uso dos verbos em hebraico e melhora significativamente a intuição gramatical.
    </Text>
  </ScrollView>
  <TouchableOpacity style={styles.button} onPress={onToggle}>
    <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>Fechar</Text>
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

export default TaskDescriptionModal4Pt;
