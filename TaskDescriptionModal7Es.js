import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal7Es = ({ visible, onToggle }) => {
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
      DESCRIPCIÓN DEL EJERCICIO 8
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Este es un ejercicio avanzado diseñado para aquellos que ya han completado con éxito las tareas de los Ejercicios 5 y 6. Es similar al ejercicio 6, pero ahora, en lugar de conjugar un solo verbo por ronda, deberás conjugar verbos seleccionados aleatoriamente de toda la base de datos.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      En cada ronda, se seleccionan aleatoriamente verbos en una de sus formas conjugadas en hebreo. Tu tarea es elegir la traducción correcta en el idioma seleccionado de entre 6 opciones.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Este ejercicio está destinado a estudiantes avanzados que tienen un buen conocimiento de la conjugación de los verbos en hebreo. Ayuda a desarrollar automatización, mejorar la velocidad y precisión en la identificación de las formas correctas y profundizar la comprensión de los patrones de conjugación en los diferentes binyanim.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      La práctica regular de este ejercicio contribuye a un dominio profundo del sistema verbal hebreo, aumenta la confianza en el uso de los verbos en hebreo y mejora significativamente la intuición gramatical.
    </Text>
  </ScrollView>
  <TouchableOpacity style={styles.button} onPress={onToggle}>
    <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>Cerrar</Text>
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

export default TaskDescriptionModal7Es;
