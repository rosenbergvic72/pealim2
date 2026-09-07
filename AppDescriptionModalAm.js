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
              <Text style={styles.modalTitle}>የመተግበሪያ መግለጫ</Text>

              <Text style={styles.modalText}>
                ይህ{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  ውጤታማ አሰልጣኝ እና መሣሪያ
                </Text>{' '}
                ቀድሞውኑ ዕብራይስጥን ለሚማሩ፣
                <Text style={[styles.bold, styles.highlightMain]}>መሠረታዊ ዕውቀት</Text>{' '}
                ላላቸው፣
                <Text style={[styles.bold, styles.highlightMain]}>
                  ግሦችን በፍጥነት እና በትክክል ማጣመር ለመማር
                </Text>{' '}
                ወይም{' '}
                <Text style={[styles.bold, styles.highlightMain]}>
                  ይህን ችሎታ ለማሻሻል
                </Text>{' '}
                ለሚፈልጉ ነው። መተግበሪያው{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>ለጀማሪዎች</Text>{' '}
                ጠቃሚ ነው፣ ምክንያቱም{' '}
                <Text style={[styles.bold, styles.highlightMain]}>ግሦችን</Text>፣ ቅርጾቻቸውን፣{' '}
                <Text style={[styles.bold, styles.highlightAccent]}>ቢንያኖችን</Text> እና
                <Text style={[styles.bold, styles.highlightAccent]}>
                  {' '}
                 ትዕዛዞችን (አስገዳጅዎችን) አጠቃቀምን ለመለማመድ
                </Text>{' '}
                መልመጃዎችን ያካትታል።
              </Text>

              {/* ዋና ልምምዶች */}
              <Text style={styles.modalTitle}>ዋና ልምምዶች</Text>

              <Text style={styles.modalText}>
                <Text style={[styles.bold, styles.highlightMain]}>
                  የግሶች ውህደት የመተግበሪያው ዋና አካል ነው።
                </Text>
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • መልመጃዎች 5 እና 6 -
                </Text>{' '}
                ለውህደት ልምምድ ዋና ተግባራት ናቸው። ችሎታው በራስ-ሰር እስኪሆን ድረስ በየጊዜው እንዲሰሩ
                እንመክራለን።
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • መልመጃዎች 7 እና 8 -
                </Text>{' '}
                የ 5 እና 6 መልመጃዎች የላቁ ስሪቶች ናቸው። እነሱ ቀድሞውኑ በራስ መተማመን ያላቸው ውጤቶችን
                ላገኙ እና ልምዳቸውን ወደ ቀጣዩ ደረጃ ለማድረስ ለሚፈልጉ የተነደፉ ናቸው።
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightTip]}>• ጠቃሚ ምክር:</Text>{' '}
                በመጀመሪያ በ 5 እና 6 መልመጃዎች ውስጥ ውህደትን ይለማመዱ, ከዚያም ወደ ውስብስብ 7 እና 8
                ይሂዱ!
              </Text>

              <Text style={styles.modalText}>
                <Text style={[styles.bold, styles.highlightMain]}>
                  መሠረታዊ ነገሮችን ለመማር መልመጃዎች።
                </Text>
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • መልመጃዎች 1 እና 2 -
                </Text>{' '}
                ወደ 400 የሚጠጉ ቁልፍ ግሦችን እና መሰረታዊ ቅርጾቻቸውን ለማስታወስ ይረዳሉ።
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • መልመጃ 3 -
                </Text>{' '}
                የግስን ቢንያን ለመወሰን ልምምድ (መሠረታዊ ዕውቀት ያስፈልጋል)።
              </Text>

              <Text style={styles.listItem}>
                <Text style={[styles.bold, styles.highlightExercise]}>
                  • መልመጃ 4 -
                </Text>{' '}
                በዕብራይስጥ ውስጥ ትዕዛዞችን ለመለማመድ አሰልጣኝ።
              </Text>

              {/* የመጨረሻ ብሎክ */}
              <Text style={styles.finalText}>
                <Text style={[styles.bold, styles.highlightFinal]}>
                  የተከታታይ መልመጃዎች አፈፃፀም በዕለት ተዕለት ንግግር ውስጥ የግሦችን እና ውህደቶቻቸውን ትክክለኛ
                  አጠቃቀም ጠንካራ መሠረት ይጥላል!
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
