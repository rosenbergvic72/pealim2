import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AppDescriptionModal = ({ visible, onToggle }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onToggle}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalView,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.contentWrapper}>
            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
  
            {/* الشعار */}
            <View style={styles.logoContainer}>
              <Image source={require('./VERBIFY.png')} style={styles.logo} />
            </View>
  
            {/* العنوان */}
            <Text style={styles.modalTitle}>وصف التطبيق</Text>
  
            <Text style={styles.modalText}>
              هذا <Text style={styles.bold}>مدرب وأداة فعالة</Text> لأولئك الذين يدرسون العبرية بالفعل،
              لديهم <Text style={styles.bold}>معرفة أساسية،</Text> يريدون
              <Text style={styles.bold}>تعلم تصريف الأفعال بسرعة وبشكل صحيح</Text> أو <Text style={styles.bold}>تحسين هذه المهارة</Text>.
              التطبيق مفيد أيضًا <Text style={styles.bold}>للمبتدئين</Text>، حيث يتضمن تمارين
              <Text style={styles.bold}>لحفظ الأفعال</Text>، وأشكالها، <Text style={styles.bold}>والأبنية</Text> و
              <Text style={styles.bold}>التدريب على استخدام صيغة الأمر (الأوامر)</Text>.
            </Text>
  
            {/* التمارين الرئيسية */}
            <Text style={styles.modalTitle}>التمارين الرئيسية</Text>
  
            <Text style={styles.modalText}>
              <Text style={styles.bold}>تصريف الأفعال هو جزء رئيسي من التطبيق.</Text>
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• التمرينان 5 و 6 -</Text> هما المهام الرئيسية لممارسة التصريف. نوصي بتنفيذها بانتظام حتى تصبح المهارة تلقائية.
  
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• التمرينان 7 و 8 -</Text> إصدارات متقدمة من التمرينين 5 و 6. وهي مصممة لأولئك الذين حققوا بالفعل نتائج واثقة ويريدون الارتقاء بممارستهم إلى المستوى التالي.
  
            </Text>
  
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• نصيحة:</Text> مارس أولاً التصريف في التمرينين 5 و 6، ثم انتقل إلى التمرينين 7 و 8 الأكثر تعقيدًا!
  
            </Text>
  
            <Text style={styles.modalText}>
              <Text style={styles.bold}>تمارين لتعلم الأساسيات.</Text>
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• التمرينان 1 و 2 -</Text> يساعدان على حفظ حوالي 300 فعل رئيسي وأشكاله الأساسية.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• التمرين 3 -</Text> التدريب على تحديد بنية الفعل (المعرفة الأساسية مطلوبة).
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• التمرين 4 -</Text> مدرب لممارسة صيغة الأمر في العبرية.
            </Text>
  
            {/* الكتلة النهائية */}
            <Text style={styles.finalText}>
              <Text style={styles.bold}>الممارسة المستمرة للتمارين تضع أساسًا متينًا للاستخدام الصحيح للأفعال وتصريفها في الكلام اليومي!</Text>
            </Text>
  
          </ScrollView>
  
          {/* زر الإغلاق */}
          {/* <TouchableOpacity style={styles.button} onPress={onToggle}>
            <Text style={styles.textStyle}>إغلاق</Text>
          </TouchableOpacity> */}
  
        {/* Fixed Close Button */}
                    <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={onToggle}>
          <Text style={styles.textStyle}>إغلاق</Text>
          </TouchableOpacity>
        </View>
                  </View>
                </Animated.View>
              </View>
            </Modal>
          );
        };
        
        const styles = StyleSheet.create({
          overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          },
          modalView: {
            width: '90%',
            height: SCREEN_HEIGHT * 0.85,
            backgroundColor: '#FFFDEF',
            borderRadius: 10,
            overflow: 'hidden',
          },
          contentWrapper: {
            flex: 1,
            justifyContent: 'space-between',
          },
          scrollArea: {
            flex: 1,
          },
          scrollViewContent: {
            padding: 20,
            paddingBottom: 30,
          },
          logoContainer: {
            alignItems: 'center',
            marginBottom: 10,
          },
          logo: {
            width: 120,
            height: 120,
            resizeMode: 'contain',
          },
          modalTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 15,
          },
          modalText: {
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 10,
          },
          listItem: {
            fontSize: 16,
            textAlign: 'left',
            marginBottom: 5,
          },
          finalText: {
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: 15,
          },
          bold: {
            fontWeight: 'bold',
          },
          buttonWrapper: {
            alignItems: 'center',
          },
          button: {
            backgroundColor: '#2D4769',
            padding: 12,
            alignItems: 'center',
            justifyContent: 'center',
            width: '40%', // или сколько нужно
            borderRadius: 8,
            marginTop: 10,
            marginBottom: 30,
          },
          textStyle: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
          },
        });
        
        export default AppDescriptionModal;
