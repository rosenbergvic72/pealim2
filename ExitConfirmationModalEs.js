// ExitConfirmationModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const ExitConfirmationModalEs = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>¿Realmente deseas salir?</Text>
    <Text style={styles.modalText1} maxFontSizeMultiplier={1.2}>El progreso de la tarea no se guardará.</Text>
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={onConfirm}>
        <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Sí</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onCancel}>
        <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>No</Text>
      </TouchableOpacity>
    </View>
</View>

</View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFDEF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
  },
  modalText: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  modalText1: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center'
    // fontWeight: 'bold'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  button: {
    flex: 1,
    backgroundColor: '#2B3270',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ExitConfirmationModalEs;
