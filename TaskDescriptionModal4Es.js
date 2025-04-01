import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal4Es = ({ visible, onToggle }) => {
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
      DESCRIPCIÓN DEL EJERCICIO 7
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      Este es un ejercicio avanzado diseñado para aquellos que ya han completado con éxito las tareas de los Ejercicios 5 y 6. Es similar al ejercicio 5, pero ahora, en lugar de conjugar un solo verbo por ronda, deberás conjugar verbos seleccionados aleatoriamente de toda la base de datos.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      En cada ronda, se mostrarán 6 pares de todas las formas verbales posibles en secuencia. Tu tarea es emparejar correctamente estas formas en hebreo con sus traducciones correspondientes en el idioma seleccionado. Al igual que en el ejercicio 5, primero seleccionas una opción en la columna izquierda y luego su equivalente en la columna derecha.
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

export default TaskDescriptionModal4Es;
