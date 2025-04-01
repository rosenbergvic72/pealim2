import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TaskDescriptionModal4 = ({ visible, onToggle }) => {
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
        وصف التمرين 4
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>في هذا التمرين، سيتم عرض أمر أو طلب مُعبر عنه بفعل في صيغة الأمر، إلى جانب صورة لشخص أو لمجموعة من الأشخاص الذين يتم توجيه الأمر إليهم (رجل، امرأة أو مجموعة). مهمتك هي اختيار الصيغة الصحيحة للأمر في العبرية من بين أربعة خيارات مقترحة.

</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>حتى مع معرفة بسيطة بهذا الموضوع، فإن الممارسة المنتظمة ستساعدك على التعرف بشكل طبيعي على أنماط تكوين الأمر في العبرية. تتيح لك هذه الطريقة التدريبية حفظ الصيغ الصحيحة بسرعة، وتطوير فهم حدسي للقواعد النحوية، وتحسين قدرتك على استخدام اللغة في المواقف الواقعية.

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

export default TaskDescriptionModal4;
