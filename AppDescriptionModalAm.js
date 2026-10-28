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
              {/* አርማ */}
              <View style={styles.logoContainer}>
                <Image source={require('./VERBIFY.png')} style={styles.logo} />
              </View>

              {/* ርዕስ */}
<Text style={styles.modalTitle}>የመተግበሪያው መግለጫ</Text>

<Text style={styles.modalText}>
  Verbify{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    የዕብራይስጥ ግሶችን ለመማርና ለመለማመድ የሚረዳ ተግባራዊ መሣሪያ
  </Text>
  {' '}ነው። ግሶችን ለማስታወስ፣ ቢንያኒምን ለመረዳት፣
  የግስ ማጣመርን ለመለማመድ፣ ግሶችን ከመስተዋድዶች ጋር
  በትክክል ለመጠቀም እና ግሶችን በዓረፍተ ነገሮች ውስጥ
  በትክክል ለመጠቀም ይረዳል።
</Text>

<Text style={styles.modalText}>
  መተግበሪያው{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    መሠረታዊ የዕብራይስጥ እውቀት
  </Text>
  {' '}ላላቸው ተማሪዎችም ሆነ በጣም የተለመዱ ግሶችን
  እና የተለያዩ ቅርጾቻቸውን ቀስ በቀስ ለመማር ለሚፈልጉ
  ጀማሪዎች ተስማሚ ነው።
</Text>

{/* የግስ ካርዶች */}
<Text style={styles.modalTitle}>የግስ ካርዶች</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • የግስ ካርዶች —
  </Text>{' '}
  አንድን ግስ፣ ትርጉሙን፣ ቢንያኑን እና የተለያዩ
  የማጣመር ቅርጾቹን በፍጥነት ለመመልከት የሚረዳ
  ቀላልና ምቹ መንገድ ነው።
</Text>

{/* ልምምዶች */}
<Text style={styles.modalTitle}>ልምምዶች</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 1 እና 2 —
  </Text>{' '}
  ከ400 በላይ አስፈላጊ የዕብራይስጥ ግሶችን ለማስታወስ
  እና የተጻፈውን ግስ ከትርጉሙ ጋር ለማገናኘት ይረዳሉ።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 3 —
  </Text>{' '}
  የዕብራይስጥ ግስ ቢንያን ለመለየት የሚደረግ ልምምድ ነው።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 4 —
  </Text>{' '}
  በዕብራይስጥ የትእዛዝ ቅርጽን ለመለማመድ የሚረዳ ልምምድ ነው።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 5 እና 6 —
  </Text>{' '}
  የዕብራይስጥ ግሶችን ማጣመር ለመለማመድ ዋና ልምምዶች ናቸው።
  መደበኛ ልምምድ ትክክለኛውን የግስ ቅርጽ በፍጥነትና
  በራስ-ሰር ለመምረጥ ይረዳል።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 7 እና 8 —
  </Text>{' '}
  መሠረታዊ ልምምዶቹን በደንብ ለሚችሉ ተማሪዎች
  የበለጠ የላቀ የግስ ማጣመር ልምምድ ናቸው።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 9 «ግስ በዓረፍተ ነገር ውስጥ» —
  </Text>{' '}
  በዓረፍተ ነገሩ አውድ መሠረት ትክክለኛውን የግስ ቅርጽ
  ይምረጡ። ጊዜን፣ ሰውን፣ ቁጥርን እና ጾታን ያስተውሉ።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 10 «አዳምጥ እና ተረዳ» —
  </Text>{' '}
  የዕብራይስጥ ዓረፍተ ነገሮችን ያዳምጡና ትክክለኛውን
  ትርጉም ይምረጡ። ይህ ልምምድ የመስማት ግንዛቤን ያዳብራል።
</Text>


{/* ልምምድ 11 */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 11 «ግሱን ይገንቡ» —
  </Text>{' '}
  ፊደላትን በትክክለኛው ቅደም ተከተል በመምረጥ
  የዕብራይስጥ ግሶችን የተለያዩ ቅርጾች ራስዎ ይገንቡ።
  የግሱ መነሻ ቅርጽ፣ ሥር እና ቢንያን ትክክለኛውን
  ቅርጽ ለማስታወስ ይረዳሉ። በሶስት ሙከራዎች
  ውስጥ ፍንጮች ቀስ በቀስ ይሰጣሉ።
  ይህ ልምምድ የማስታወስ ችሎታን ያጠናክራል፣
  የአጻጻፍ ትክክለኛነትን ያሻሽላል እና ከተዘጋጁ
  መልሶች ውጭ የግስ ቅርጾችን ለመፍጠር ይረዳል።
</Text>


{/* ልምምድ 12 */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • ልምምድ 12 «ግሱን በዓረፍተ ነገር ውስጥ ይጻፉ» —
  </Text>{' '}
  በዕብራይስጥ ዓረፍተ ነገር ውስጥ የጎደለውን የግስ ቅርጽ
  በቁልፍ ሰሌዳው ፊደላትን በመምረጥ ይሙሉ።
  ትርጉሙ አውዱን፣ ጊዜውን፣ ሰውን፣ ቁጥርን እና ጾታን
  ለመለየት ይረዳዎታል። ሦስት ሙከራዎች አሉዎት፦
  መጀመሪያ ያለ ፍንጭ፣ በሁለተኛው አስፈላጊ ፊደላት
  ይደምቃሉ፣ በሦስተኛውም ዓረፍተ ነገሩን ማዳመጥ
  ይችላሉ። ይህ ልምምድ ከማስታወስ መልስ የማውጣት
  ችሎታን ያጠናክራል፣ አጻጻፍን ያሻሽላል እና
  ግሶችን በትክክል ለመጠቀም ይረዳል።
</Text>


{/* ግሶች እና መስተዋድዶች */}
<Text style={styles.modalTitle}>ግሶች እና መስተዋድዶች</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «መስተዋድዶች 1» —
  </Text>{' '}
  በዕለታዊ ዕብራይስጥ ከግሶች ጋር በብዛት የሚጠቀሙ
  መስተዋድዶችን ለመለማመድ ይረዳል።
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «መስተዋድዶች 2» —
  </Text>{' '}
  ግሶችን ከመስተዋድዶች ጋር በማጣመር የሚደረግ
  የበለጠ የላቀ ልምምድ ነው። ቃላትን በተናጠል
  ከማስታወስ ይልቅ ተፈጥሯዊ ጥምረቶችን ለመማር ይረዳል።
</Text>

{/* አንድ ሥር ያላቸው ግሶች */}
<Text style={styles.modalTitle}>አንድ ሥር ያላቸው ግሶች</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «አንድ ሥር ያላቸው ግሶች» —
  </Text>{' '}
  አንድ ሥር የሚጋሩ ግሶችን በተለያዩ ቢንያኒም ውስጥ
  ያነጻጽሩ እና የቢንያን ለውጥ የግሱን ትርጉም
  እንዴት ሊቀይር እንደሚችል ይመልከቱ።
</Text>

{/* ምክር */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• ምክር፦</Text>{' '}
  መጀመሪያ ግሶችንና መሠረታዊ ቅርጾቻቸውን ይማሩ፣
  ከዚያም ወደ ማጣመር፣ መስተዋድዶች እና ዓረፍተ ነገሮች
  ይሂዱ። በዚህ መንገድ ትክክለኛዎቹን ቅርጾች ማወቅና
  መጠቀም ቀስ በቀስ ፈጣንና ተፈጥሯዊ ይሆናል።
</Text>

{/* የመጨረሻ ጽሑፍ */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    በVerbify መደበኛ ልምምድ የዕብራይስጥ ግሶችን ለማስታወስ
    ብቻ ሳይሆን ቅርጾቻቸውን በፍጥነት ለመለየት፣
    በዓረፍተ ነገሮች ውስጥ በትክክል ለመጠቀም
    እና የሚነገር ዕብራይስጥን በተሻለ ሁኔታ ለመረዳት ይረዳል።
  </Text>
</Text>
            </ScrollView>

            {/* Fixed Close Button */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.button} onPress={onToggle}>
                <Text style={styles.textStyle}>ዝጋ</Text>
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
    color: '#1C3F60',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333652',
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

  // 🔹 Цветовые акценты (те же, что в RU-версии):
  highlightMain: {
    color: '#0F4C81', // тёмно-синий — ключевые идеи
  },
  highlightExercise: {
    color: '#C8502D', // тёплый акцент для упражнений
  },
  highlightTip: {
    color: '#00796B', // зелёный для советов
  },
  highlightAccent: {
    color: '#8E24AA', // фиолетовый для важных терминов / категорий
  },
  highlightFinal: {
    color: '#D81B60', // яркий акцент для финальной фразы
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
