import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import Constants from 'expo-constants';

const AppInfoModal = ({ visible, onClose }) => {
    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
          <View style={styles.modalBackground}>
            <View style={styles.modalView}>
      
              {/* አርማ */}
              <Image source={require('./VERBIFY.png')} style={styles.logo} />
      
              {/* ርዕስ */}
              <Text style={styles.modalTitle}>ስለ መተግበሪያው</Text>
      
              {/* ስሪት እና ዝማኔ */}
              <Text style={styles.modalText}>ስሪት: <Text style={styles.bold}>{Constants.expoConfig?.version || 'ያልታወቀ'}</Text></Text>
              <Text style={styles.modalText}>የዘመነ: <Text style={styles.bold}>01.02.2025</Text></Text>
      
              {/* መሰረታዊ መረጃ
              <Text style={styles.sectionTitle}>መግለጫ:</Text>
              <Text style={styles.modalText}>
                <Text style={styles.bold}>Verbify</Text> በዕብራይስጥ የግስ ውህደት መስተጋብራዊ አሰልጣኝ ነው።
                በሁሉም ደረጃ ላሉ የቋንቋ ተማሪዎች ተስማሚ ነው።
              </Text> */}
      
              {/* ቴክኒካዊ መረጃ */}
              <Text style={styles.sectionTitle}>ቴክኒካዊ መረጃ:</Text>
              <Text style={styles.modalText}>ድጋፍ: Android, iOS</Text>
              <Text style={styles.modalText}>ዝቅተኛ ስሪት:</Text>
              <Text style={styles.modalText}>Android 8.0+, iOS 13.0+</Text>
              <Text style={styles.modalText}>መጠን: 148 MB</Text>
      
              {/* እውቂያዎች */}
              <Text style={styles.sectionTitle}>እውቂያዎች:</Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('mailto:verbify2025@gmail.com')}>
                ድጋፍ: verbify2025@gmail.com
              </Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.verbify.com/privacy')}>
                የግላዊነት መመሪያ
              </Text>
      
              {/* የመዝጊያ ቁልፍ */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>ዝጋ</Text>
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
