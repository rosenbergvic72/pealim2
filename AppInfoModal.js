import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import Constants from 'expo-constants';

const AppInfoModal = ({ visible, onToggle, updatedAt, appSize }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onToggle}>
      <View style={styles.modalBackground}>
        <View style={styles.modalView}>
          
          {/* Логотип */}
          <Image source={require('./VERBIFY.png')} style={styles.logo} />

          {/* Заголовок */}
          <Text style={styles.modalTitle}>О ПРИЛОЖЕНИИ</Text>

          {/* Версия и обновление */}
          <Text style={styles.modalText}>Версия: <Text style={styles.bold}>{Constants.expoConfig?.version || 'Неизвестно'}</Text></Text>
          <Text style={styles.modalText}>Обновлено: <Text style={styles.bold}>{updatedAt || '20.08.2025'}</Text></Text>

          {/* Основная информация
          <Text style={styles.sectionTitle}>Описание:</Text>
          <Text style={styles.modalText}>
            <Text style={styles.bold}>Verbify</Text> — это интерактивный тренажер спряжения глаголов в иврите.
            Подходит для изучающих язык на всех уровнях.
          </Text> */}

          {/* Технические данные */}
          <Text style={styles.sectionTitle}>Технические данные:</Text>
          <Text style={styles.modalText}>Поддержка: Android, iOS</Text>
          <Text style={styles.modalText}>Минимальная версия:</Text>
          <Text style={styles.modalText}>Android 8.0+, iOS 13.0+</Text>
          <Text style={styles.modalText}>Размер: <Text style={styles.bold}>{appSize || '189 Mb'}</Text></Text>

          {/* Контакты */}
          <Text style={styles.sectionTitle}>Контакты:</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('mailto:verbify2025@gmail.com')}>
            Поддержка: verbify2025@gmail.com
          </Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://verbifyapp.netlify.app')}>
            Политика конфиденциальности
          </Text>

          {/* Кнопка закрытия */}
          <TouchableOpacity style={styles.closeButton} onPress={onToggle}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
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
