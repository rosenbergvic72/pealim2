import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal7Ar = ({ visible, onToggle }) => {
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
      وصف التمرين 8
    </Text>

    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      هذا تمرين متقدم مخصص لأولئك الذين تمكنوا بالفعل من إتقان المهام في التمارين 5 و6. إنه مشابه للتمرين 6، ولكن الآن، بدلاً من تصريف فعل واحد في كل جولة، ستحتاج إلى تصريف أفعال مختارة عشوائيًا من قاعدة البيانات بأكملها.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      في كل جولة، يتم اختيار أفعال بشكل عشوائي في إحدى صيغها المصرفة في العبرية. مهمتك هي اختيار الترجمة الصحيحة باللغة المحددة من بين 6 خيارات مقترحة.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      هذا التمرين موجه للمتعلمين المتقدمين الذين لديهم معرفة جيدة بتصريف الأفعال العبرية. يساعد على تطوير التلقائية، وتحسين سرعة ودقة التعرف على الأشكال الصحيحة، وتعميق فهم أنماط التصريف في مختلف البنيانيم.
    </Text>
    <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
      الممارسة المنتظمة لهذا التمرين تساهم في إتقان عميق لنظام الأفعال العبرية، وتعزز الثقة في استخدام الأفعال العبرية، وتحسن بشكل كبير الحدس النحوي.
    </Text>
  </ScrollView>
  <TouchableOpacity style={styles.button} onPress={onToggle}>
    <Text style={styles.textStyle} maxFontSizeMultiplier={1.2}>إغلاق</Text>
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

export default TaskDescriptionModal7Ar;
