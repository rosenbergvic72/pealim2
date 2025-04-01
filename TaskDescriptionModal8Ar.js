import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal8Ar = ({ visible, onToggle }) => {
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
    وصف التمرين 6
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    هذا التمرين مشابه للتمرين 5، وهو أيضًا أحد التمارين الرئيسية في التطبيق، وقد تم تصميمه لتدريب تصريف الأفعال العبرية بشكل فعال.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    في كل جولة، يتم اختيار فعل عبري عشوائيًا، ويجب عليك العثور على الزوج الصحيح لإحدى صيغ تصريفه. سيتم عرض 36 (أو 24) من الأفعال المصرفة بالعبرية على التوالي، ومهمتك هي اختيار الترجمة الصحيحة باللغة المحددة من بين 6 خيارات مقترحة.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    يُوصى بهذا التمرين لأولئك الذين يدرسون العبرية ولديهم على الأقل معرفة أساسية بتصريف الأفعال. حتى مع الحد الأدنى من المعرفة، ستساعدك الممارسة المنتظمة على حفظ أشكال التصريف بشكل أفضل، والتعرف على الأنماط، وتعزيز مهاراتك من خلال التدريب المستمر.
  </Text>
  <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
    التدريب المستمر يساهم في فهم أعمق لنظام الأفعال في العبرية، ويطور الإدراك اللغوي الغريزي، ويحسن مهارات فهم اللغة العبرية.
  </Text>
 </ScrollView>

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

export default TaskDescriptionModal8Ar;
