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
        DESCRIPTION DE L’EXERCICE 4
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Dans cet exercice, vous verrez une commande ou une demande exprimée avec un verbe à l'impératif, accompagnée d'une image représentant une personne ou un groupe de personnes à qui l'ordre est adressé (homme, femme ou groupe). Votre tâche est de choisir la bonne forme impérative en hébreu parmi les quatre options proposées.

</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Même avec des connaissances minimales sur ce sujet, une pratique régulière vous aidera à reconnaître naturellement les schémas de formation de l'impératif en hébreu. Cette méthode d'apprentissage permet de mémoriser rapidement les formes correctes, de développer une compréhension intuitive de la grammaire et d'améliorer votre capacité à utiliser la langue efficacement dans des situations réelles.

</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>Fermer</Text>
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
