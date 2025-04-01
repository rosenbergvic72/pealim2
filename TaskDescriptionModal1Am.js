import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TaskDescriptionModal6 = ({ visible, onToggle }) => {
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
        የስልጠና 1 መግለጫ
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>በዚህ ልምምድ እ.ኤ.አ ከ300 በላይ በዝርዝሩ የተጠቀሙትን የአብርሃም ግሶች ማስታወስና ማረም ይችላሉ። የአብርሃም ግስ የተለጠፈና የተነገረ ከአራት የአማርኛ ትርጉም አማራጭ ጋር ይታያል። ተግባርህ ትክክለኛውን ትርጉም መምረጥ ነው።

በተመሳሳይ ጊዜ ይህን ግስ የያዘ በቀላሉ የተቀናጀ ድምፅ ያለው ሐሳብ በአንድኛው ወይም በሴት ተመርጧል።


</Text>




<Text style={styles.modalText}maxFontSizeMultiplier={1.2}> ይህ ልምምድ የግሶችን አጠቃቀም የተሻለ ማስታወስ ይረዳል፣ የፈጣን ትርጉም እውቀትን ማዳበርና የድምፅ እንደምን መረዳትን ማሻሻል፣ ይህም በአብርሃም ቋንቋ በደስታ ለመገናኘት አስፈላጊ ነው።

</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>ዝጋ</Text>
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

export default TaskDescriptionModal6;
