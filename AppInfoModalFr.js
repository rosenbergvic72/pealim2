import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import Constants from 'expo-constants';

const AppInfoModal = ({ visible, onClose }) => {
    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
          <View style={styles.modalBackground}>
            <View style={styles.modalView}>
      
              {/* Logo */}
              <Image source={require('./VERBIFY.png')} style={styles.logo} />
      
              {/* Titre */}
              <Text style={styles.modalTitle}>À PROPOS DE L'APPLICATION</Text>
      
              {/* Version et Mise à jour */}
              <Text style={styles.modalText}>Version : <Text style={styles.bold}>{Constants.expoConfig?.version || 'Inconnu'}</Text></Text>
              <Text style={styles.modalText}>Mise à jour : <Text style={styles.bold}>01.02.2025</Text></Text>
      
              {/* Informations de base
              <Text style={styles.sectionTitle}>Description :</Text>
              <Text style={styles.modalText}>
                <Text style={styles.bold}>Verbify</Text> est un entraîneur interactif de conjugaison de verbes en hébreu.
                Convient aux apprenants de langues de tous niveaux.
              </Text> */}
      
              {/* Données techniques */}
              <Text style={styles.sectionTitle}>Données techniques :</Text>
              <Text style={styles.modalText}>Support : Android, iOS</Text>
              <Text style={styles.modalText}>Version minimale :</Text>
              <Text style={styles.modalText}>Android 8.0+, iOS 13.0+</Text>
              <Text style={styles.modalText}>Taille : 148 Mo</Text>
      
              {/* Contacts */}
              <Text style={styles.sectionTitle}>Contacts :</Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('mailto:verbify2025@gmail.com')}>
                Support : verbify2025@gmail.com
              </Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.verbify.com/privacy')}>
                Politique de confidentialité
              </Text>
      
              {/* Bouton de fermeture */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Fermer</Text>
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
