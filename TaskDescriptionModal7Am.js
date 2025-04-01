import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal7Am = ({ visible, onToggle }) => {
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
      የስልጠና 8 መግለጫ
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      ይህ የተረፈ ደረጃ ልምምድ ሲሆን ስልጠና 5 እና 6 የማሳለፍ ተሳክቷል። ይህ ስልጠና ከስልጠና 6 ጋር ተመሳሳይ ሲሆን፣ አንድ ግስ በዙር ውስጥ ሳይሆን ከመረጃ ጎታ ውስጥ በአዲስ የተመረጡ ግሶችን ማደራጃ ይጠየቃል።
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      በእያንዳንዱ ዙር፣ የተመረጡት ግሶች በአብርሃም ቅዋም ውስጥ ይሆናሉ። የትክክለኛውን ትርጓሜ ከተቀረው 6 አማራጮች ውስጥ ማስረጃ ይኖርብዎታል።
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      ይህ ልምምድ ለተረፈ ደረጃ ተማሪዎች የተዘጋጀ ሲሆን፣ የአብርሃም ግሶችን ለመተየብ የሚረዳ ስልጠና ነው። እርስዎን ለደህንነት የስምምን ትዝታን ለማሳደግ ይረዳል።
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      ቀጣይነት ያለው ስልጠና የአብርሃም ቋንቋን በደንብ ማስተዋልን፣ የስምምን ትዝታን ማሳደግን እና የአብርሃም ቋንቋን ለማግኘት ይረዳል።
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

export default TaskDescriptionModal7Am;
