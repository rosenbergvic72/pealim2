import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal8Es = ({ visible, onToggle }) => {
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
    DESCRIPCIÓN DEL EJERCICIO 6
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Este ejercicio es similar al Ejercicio 5, también es uno de los ejercicios principales de la aplicación y está diseñado para entrenar eficazmente la conjugación de los verbos en hebreo.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    En cada ronda, se selecciona aleatoriamente un verbo en hebreo y debes encontrar la pareja correcta para una de sus formas conjugadas. Se mostrarán secuencialmente 36 (o 24) formas verbales conjugadas en hebreo, y tu tarea es elegir la traducción correcta en el idioma seleccionado de entre 6 opciones.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    Este ejercicio está recomendado para quienes ya están estudiando hebreo y tienen al menos conocimientos básicos sobre la conjugación de verbos. Incluso con un conocimiento mínimo del tema, la práctica regular te ayudará a memorizar mejor las formas de conjugación, identificar patrones y reforzarlos a través de la práctica.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    El entrenamiento constante contribuye a una comprensión más profunda del sistema verbal hebreo, al desarrollo de una intuición gramatical y a la mejora de la comprensión del hebreo.
  </Text>
 </ScrollView>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>Cerrar</Text>
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

export default TaskDescriptionModal8Es;
