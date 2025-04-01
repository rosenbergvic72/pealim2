import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal7Fr = ({ visible, onToggle }) => {
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
      DESCRIPTION DE L’EXERCICE 8
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Cet exercice avancé est conçu pour ceux qui maîtrisent déjà les tâches des exercices 5 et 6. Il est similaire à l'exercice 6, mais cette fois, au lieu de conjuguer un seul verbe par tour, vous devrez conjuguer des verbes sélectionnés aléatoirement dans toute la base de données.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      À chaque tour, des verbes sont sélectionnés au hasard dans l’une de leurs formes conjuguées en hébreu. Votre tâche est de choisir la bonne traduction dans la langue sélectionnée parmi 6 options proposées.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Cet exercice est destiné aux apprenants avancés qui connaissent bien la conjugaison des verbes hébreux. Il permet de développer l'automatisme, d'améliorer la rapidité et la précision dans la reconnaissance des formes verbales et d'approfondir la compréhension des modèles de conjugaison dans les différents binyanim.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Une pratique régulière de cet exercice favorise une maîtrise approfondie du système verbal hébreu, renforce la confiance dans l'utilisation des verbes en hébreu et améliore significativement l’intuition grammaticale.
    </Text>
  </ScrollView>
  <TouchableOpacity style={styles.button} onPress={onToggle}>
    <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>Fermer</Text>
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

export default TaskDescriptionModal7Fr;
