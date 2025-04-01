import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal6Am = ({ visible, onToggle }) => {
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
    የስልጠና 5 መግለጫ
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
        ይህ በመተግበሪያው ዋና ልምምድ ሲሆን የአብርሃም ግሶችን በትክክል ለማድረግ የተዘጋጀ ነው።
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      በእያንዳንዱ ዙር፣ የአብርሃም ግስ በደንብ ይምረጣል፣ እና ከተለጠፈው ስምም ጋር ትክክለኛውን ጥምረት መፈለግ ይኖርብዎታል። ከተቻለው 36 (ወይም 24) ምሳሌዎች ውስጥ 6 ይታያሉ፣ እነሱም በአብርሃም የተዘጋጁ ግሶችና በተመረጠው ቋንቋ የሚገኙ ትርጉሞች ይሆናሉ። ትክክለኛ ጥምረት ለማድረግ፣ አንዳንድ ምሳሌ በግምት ይምረጥ፣ ከዛም ተዛማጅ ቅዋምን በአብርሃም ቋንቋ ይምረጥ።
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
        ይህ ልምምድ የአብርሃምን ቋንቋ የሚያውቁ እና በምክንያት የአብርሃም ግስ ስም ሲሆን የሚገኙ ወንድሞችን ለማየት በተዘጋጀ ነው። ተደጋጋሚ ልምምድ የግስ ስም ለማስታወስ፣ የስምምን የትክክል ተያያዥነት ማጣጣልና በተስተካከለ ዘዴ ለማድረግ ይረዳል።
      </Text>
      <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
        ትክክለኛ ልምምድ የአብርሃም ግስ ስምን ለመረዳት፣ አንዳንድ ተያያዥ የሆነ እውቀትን ለማዳበርና የአብርሃም ቋንቋን ለማስተዋል ይረዳል።
      </Text>
    </ScrollView>
    <TouchableOpacity style={styles.button} onPress={onToggle}>
      <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>ዝጋ</Text>
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

export default TaskDescriptionModal6Am;
