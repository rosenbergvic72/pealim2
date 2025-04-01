import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import Constants from 'expo-constants';

const AppInfoModal = ({ visible, onClose }) => {
    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
          <View style={styles.modalBackground}>
            <View style={styles.modalView}>
      
              {/* الشعار */}
              <Image source={require('./VERBIFY.png')} style={styles.logo} />
      
              {/* العنوان */}
              <Text style={styles.modalTitle}>حول التطبيق</Text>
      
              {/* الإصدار والتحديث */}
              <Text style={styles.modalText}>الإصدار: <Text style={styles.bold}>{Constants.expoConfig?.version || 'غير معروف'}</Text></Text>
              <Text style={styles.modalText}>تم التحديث: <Text style={styles.bold}>01.02.2025</Text></Text>
      
              {/* المعلومات الأساسية
              <Text style={styles.sectionTitle}>الوصف:</Text>
              <Text style={styles.modalText}>
                <Text style={styles.bold}>Verbify</Text> هو مدرب تفاعلي لتصريف الأفعال في اللغة العبرية.
                مناسب لمتعلمي اللغة على جميع المستويات.
              </Text> */}
      
              {/* البيانات التقنية */}
              <Text style={styles.sectionTitle}>البيانات التقنية:</Text>
              <Text style={styles.modalText}>الدعم: Android, iOS</Text>
              <Text style={styles.modalText}>الحد الأدنى للإصدار:</Text>
              <Text style={styles.modalText}>Android 8.0+, iOS 13.0+</Text>
              <Text style={styles.modalText}>الحجم: 148 ميجابايت</Text>
      
              {/* جهات الاتصال */}
              <Text style={styles.sectionTitle}>جهات الاتصال:</Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('mailto:verbify2025@gmail.com')}>
                الدعم: verbify2025@gmail.com
              </Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.verbify.com/privacy')}>
                سياسة الخصوصية
              </Text>
      
              {/* زر الإغلاق */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>إغلاق</Text>
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
