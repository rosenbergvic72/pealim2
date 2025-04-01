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
        የስልጠና 4 መግለጫ
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>በዚህ ልምምድ፣ ትእዛዝ ወይም ጥያቄ በአዘዝ ቅዋም የተገለጠ በሆነ የግስ ዓይነት ይታያል፣ እንዲሁም ይህ ትእዛዝ ለማን እንደሆነ የሚያሳይ ምስል ይኖራል (ወንድ፣ ሴት ወይም ቡድን)። ተግባርህ ትክክለኛውን የአብርሃም አዘዝ መምረጥ ነው።

</Text>

<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>በዚህ ጉዞ ልምምድ አንዳንድ መረዳት ቢኖርህም፣ በተደጋጋሚ ስለሚሆን ይህ ልምምድ የአዘዝ ቅዋምን በራስህ መረዳትን ያስችላል። ይህ ዘዴ ትክክለኛ ቅዋሞችን ፈጣን ማስታወስን ያግዛል።

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

export default TaskDescriptionModal4;
