import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import Constants from 'expo-constants';

const AppInfoModal = ({ visible, onToggle , updatedAt, appSize }) => {
    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onToggle }>
          <View style={styles.modalBackground}>
            <View style={styles.modalView}>
      
              {/* Logo */}
              <Image source={require('./VERBIFY.png')} style={styles.logo} />
      
              {/* Título */}
              <Text style={styles.modalTitle}>ACERCA DE LA APLICACIÓN</Text>
      
              {/* Versión y Actualización */}
              <Text style={styles.modalText}>Versión: <Text style={styles.bold}>{Constants.expoConfig?.version || 'Desconocido'}</Text></Text>
              <Text style={styles.modalText}>Actualizado:  <Text style={styles.bold}>{updatedAt || '20.08.2025'}</Text></Text>
      
              {/* Información básica
              <Text style={styles.sectionTitle}>Descripción:</Text>
              <Text style={styles.modalText}>
                <Text style={styles.bold}>Verbify</Text> es un entrenador interactivo de conjugación de verbos en hebreo.
                Adecuado para estudiantes de idiomas de todos los niveles.
              </Text> */}
      
              {/* Datos técnicos */}
              <Text style={styles.sectionTitle}>Datos técnicos:</Text>
              <Text style={styles.modalText}>Soporte: Android, iOS</Text>
              <Text style={styles.modalText}>Versión mínima:</Text>
              <Text style={styles.modalText}>Android 8.0+, iOS 13.0+</Text>
              <Text style={styles.modalText}>Tamaño: <Text style={styles.bold}>{appSize || '189 Mb'}</Text></Text>
      
              {/* Contactos */}
              <Text style={styles.sectionTitle}>Contactos:</Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('mailto:verbify2025@gmail.com')}>
                Soporte: verbify2025@gmail.com
              </Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://verbifyapp.netlify.app')}>
                Política de privacidad
              </Text>
      
              {/* Botón de cierre */}
              <TouchableOpacity style={styles.closeButton} onPress={onToggle }>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
      
            </View>
          </View>
        </Modal>
      );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "#FFFDEF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#2D4769",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    color: "#0038b8",
  },
  modalText: {
    fontSize: 16,
    textAlign: "left",
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  linkText: {
    fontSize: 16,
    color: "#0038b8",
    textDecorationLine: "underline",
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: "#2D4769",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 30
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
});

export default AppInfoModal;
