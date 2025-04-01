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
        وصف التمرين 2
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}> في هذا التمرين، ستتمكن من حفظ ومراجعة حوالي 300 من أكثر الأفعال استخدامًا في العبرية. سيتم عرض المصدر الفعلي لك باللغة العربية مع أربعة خيارات ترجمة إلى العبرية. مهمتك هي اختيار الخيار الصحيح.

بعد الإجابة، سيتم تقديم جملة بسيطة تحتوي على هذا الفعل باللغة العبرية مع النطق، مما يساعدك على تذكر استخدامه ونطقه بشكل أفضل.



</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>يساعد هذا التمرين في توسيع مفرداتك، وتحسين مهارات الترجمة، وتعزيز فهمك السمعي للغة العبرية.





</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>إغلاق</Text>
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
