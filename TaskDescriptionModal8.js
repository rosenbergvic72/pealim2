import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TaskDescriptionModal8 = ({ visible, onToggle }) => {
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
        ОПИСАНИЕ ЗАДАНИЯ 6
      </Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Это упражнение аналогично упражнению 5, также является основным в приложении и разработано для эффективной тренировки спряжения глаголов в иврите.</Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>В каждом раунде случайным образом выбирается глагол на иврите, и вам необходимо найти правильную пару для одной из его форм спряжения. Поочередно будут показаны 36 (или 24) глагольных форм на иврите, и ваша задача — выбрать правильный перевод на выбранном языке из 6 предложенных вариантов.</Text>
          <Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Это упражнение рекомендуется тем, кто уже изучает иврит и обладает хотя бы базовыми знаниями о спряжении глаголов. Даже при минимальном понимании темы регулярная практика поможет вам лучше запомнить формы спряжения, выявить закономерности и закрепить их на практике.</Text>
<Text style={styles.modalText}maxFontSizeMultiplier={1.2}>Постоянные тренировки способствуют более глубокому пониманию системы спряжения глаголов, развитию интуитивного восприятия грамматических закономерностей и улучшению навыков восприятия иврита.
</Text>
 </ScrollView>

          <TouchableOpacity
            style={styles.button}
            onPress={onToggle}
          >
            <Text style={styles.textStyle}maxFontSizeMultiplier={1.2}>Закрыть</Text>
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

export default TaskDescriptionModal8;
