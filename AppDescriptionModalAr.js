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
  Verbify هو{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    أداة عملية لتعلّم الأفعال العبرية والتدرّب عليها
  </Text>
  . يساعدك على حفظ الأفعال، وفهم الأوزان، والتدرّب على التصريف،
  وتعلّم ارتباط الأفعال بحروف الجر، واستخدام الأفعال بشكل صحيح
  داخل الجمل.
</Text>

<Text style={styles.modalText}>
  يناسب التطبيق من لديهم بالفعل{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    معرفة أساسية باللغة العبرية
  </Text>
  ، كما يناسب المبتدئين الذين يريدون تعلّم الأفعال الأكثر شيوعًا
  وأشكالها المختلفة تدريجيًا.
</Text>

{/* بطاقات الأفعال */}
<Text style={styles.modalTitle}>بطاقات الأفعال</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • بطاقات الأفعال —
  </Text>{' '}
  طريقة سريعة ومريحة لمراجعة الفعل وترجمته ووزنه
  وأشكال تصريفه المختلفة.
</Text>

{/* التمارين */}
<Text style={styles.modalTitle}>التمارين</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرينان 1 و2 —
  </Text>{' '}
  يساعدان على حفظ أكثر من 400 فعل عبري أساسي وربط
  كل فعل مكتوب بمعناه.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرين 3 —
  </Text>{' '}
  تدريب على تحديد وزن الفعل العبري.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرين 4 —
  </Text>{' '}
  تدريب على صيغة الأمر في اللغة العبرية.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرينان 5 و6 —
  </Text>{' '}
  التمارين الأساسية للتدرّب على تصريف الأفعال العبرية.
  يساعد التدريب المنتظم على اختيار الصيغة الصحيحة للفعل
  بصورة أسرع وتلقائية.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرينان 7 و8 —
  </Text>{' '}
  تدريب أكثر تقدّمًا على التصريف لمن أصبحوا متمكنين
  من التمارين الأساسية.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرين 9 «الفعل في الجملة» —
  </Text>{' '}
  اختر الصيغة الصحيحة للفعل وفقًا لسياق الجملة.
  انتبه إلى الزمن والشخص والعدد والجنس.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرين 10 «استمع وافهم» —
  </Text>{' '}
  استمع إلى جمل باللغة العبرية واختر الترجمة الصحيحة.
  يساعد هذا التمرين على تطوير فهم اللغة المسموعة.
</Text>


{/* التمرين 11 */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • التمرين 11 «كوّن الفعل» —
  </Text>{' '}
  كوّن صيغ الأفعال العبرية بنفسك من خلال اختيار الحروف
  بالترتيب الصحيح. يساعدك المصدر والجذر والبنيان
  على تذكّر الصيغة المناسبة، بينما توفّر لك ثلاث محاولات
  تلميحات تدريجية. يساعد هذا التدريب على تقوية الذاكرة،
  وتحسين الكتابة، وتكوين صيغ الأفعال دون الاعتماد
  على خيارات إجابة جاهزة.
</Text>

{/* الأفعال وحروف الجر */}
<Text style={styles.modalTitle}>الأفعال وحروف الجر</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «حروف الجر 1» —
  </Text>{' '}
  تدريب على أكثر حروف الجر شيوعًا التي تُستخدم مع الأفعال
  في العبرية اليومية.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «حروف الجر 2» —
  </Text>{' '}
  تدريب أكثر تقدّمًا على تراكيب الأفعال مع حروف الجر.
  يساعدك على تعلّم التراكيب الطبيعية بدلًا من حفظ الكلمات
  بشكل منفصل.
</Text>

{/* الأفعال من الجذر نفسه */}
<Text style={styles.modalTitle}>أفعال من الجذر نفسه</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «أفعال من الجذر نفسه» —
  </Text>{' '}
  قارن بين أفعال تشترك في الجذر نفسه ولكنها تأتي في أوزان مختلفة،
  ولاحظ كيف يمكن أن يؤدي تغيّر الوزن إلى تغيّر معنى الفعل.
</Text>

{/* نصيحة */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• نصيحة:</Text>{' '}
  ابدأ بتعلّم الأفعال وأشكالها الأساسية، ثم انتقل إلى التصريف
  وحروف الجر والجمل. بهذه الطريقة تصبح الصيغ الصحيحة أسرع
  وأسهل في التعرّف عليها واستخدامها تلقائيًا.
</Text>

{/* النص الختامي */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    يساعدك التدريب المنتظم مع Verbify ليس فقط على حفظ الأفعال العبرية،
    بل أيضًا على التعرّف على أشكالها بسرعة أكبر، واستخدامها بشكل صحيح
    داخل الجمل، وفهم العبرية المنطوقة بصورة أفضل.
  </Text>
</Text>
            </ScrollView>

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
    marginTop: 20,
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
    color: '#1C3F60',        // тёмно-синий заголовков
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333652',        // основной текст
  },
  listItem: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 5,
    color: '#333652',
  },
  finalText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    color: '#333652',
  },
  bold: {
    fontWeight: 'bold',
  },

  // 🔹 Цветовые акценты (как в RU/AM версиях)
  highlightMain: {
    color: '#0F4C81',  // ключевые идеи
  },
  highlightExercise: {
    color: '#C8502D',  // упражнения
  },
  highlightTip: {
    color: '#00796B',  // советы
  },
  highlightAccent: {
    color: '#8E24AA',  // важные термины / категории
  },
  highlightFinal: {
    color: '#D81B60',  // яркий финальный акцент
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
