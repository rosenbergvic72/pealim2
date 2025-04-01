import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal8Fr = ({ visible, onToggle }) => {
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
    DESCRIPTION DE L’EXERCICE 6
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Cet exercice est similaire à l’exercice 5, c’est aussi l’un des exercices principaux de l’application, conçu pour un entraînement efficace à la conjugaison des verbes en hébreu.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    À chaque tour, un verbe en hébreu est sélectionné au hasard, et vous devez trouver la bonne paire pour l'une de ses formes conjuguées. Un total de 36 (ou 24) formes conjuguées en hébreu seront affichées successivement, et votre tâche est de choisir la traduction correcte dans la langue sélectionnée parmi 6 options proposées.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Cet exercice est recommandé à ceux qui étudient déjà l'hébreu et possèdent au moins une compréhension de base de la conjugaison des verbes. Même avec des connaissances minimales, une pratique régulière vous aidera à mieux mémoriser les formes de conjugaison, à reconnaître les schémas et à les renforcer par la pratique.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Un entraînement régulier permet une meilleure compréhension du système verbal hébreu, développe une intuition grammaticale et améliore les compétences en compréhension de l’hébreu.
  </Text>
 </ScrollView>

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

export default TaskDescriptionModal8Fr;
