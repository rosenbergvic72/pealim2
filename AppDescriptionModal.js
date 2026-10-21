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
              {/* Логотип */}
              <View style={styles.logoContainer}>
                <Image source={require('./VERBIFY.png')} style={styles.logo} />
              </View>

    {/* Заголовок */}
<Text style={styles.modalTitle}>ОПИСАНИЕ ПРИЛОЖЕНИЯ</Text>

<Text style={styles.modalText}>
  Verbify — это{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    тренажёр и практический инструмент для изучения глаголов иврита
  </Text>
  . Он помогает запоминать глаголы, понимать биньяны, тренировать спряжение,
  употребление предлогов и использование глаголов в предложениях.
</Text>

<Text style={styles.modalText}>
  Приложение подходит как тем, кто уже имеет{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    базовые знания иврита
  </Text>
  , так и начинающим, которые хотят постепенно освоить наиболее употребительные
  глаголы и их формы.
</Text>

{/* Карточки глаголов */}
<Text style={styles.modalTitle}>КАРТОЧКИ ГЛАГОЛОВ</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Карточки глаголов —
  </Text>{' '}
  удобный способ быстро посмотреть информацию о глаголе, его переводе,
  биньяне и формах спряжения.
</Text>

{/* Основные упражнения */}
<Text style={styles.modalTitle}>УПРАЖНЕНИЯ</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнения 1 и 2 —
  </Text>{' '}
  помогают запоминать более 400 основных глаголов иврита и связывать
  написание глагола с его переводом.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнение 3 —
  </Text>{' '}
  тренировка определения биньяна глагола.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнение 4 —
  </Text>{' '}
  тренировка повелительного наклонения в иврите.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнения 5 и 6 —
  </Text>{' '}
  основные упражнения для тренировки спряжения глаголов.
  Регулярная практика помогает довести выбор правильной формы до автоматизма.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнения 7 и 8 —
  </Text>{' '}
  более сложная практика спряжения для тех, кто уже уверенно справляется
  с базовыми заданиями.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнение 9 «Глагол в предложении» —
  </Text>{' '}
  выберите правильную форму глагола по контексту предложения.
  Здесь важно учитывать время, лицо, число и род.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнение 10 «Услышь и пойми» —
  </Text>{' '}
  слушайте предложения на иврите и выбирайте правильный перевод.
  Упражнение развивает понимание речи на слух.
</Text>


{/* Упражнение 11 */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Упражнение 11 «Собери глагол» —
  </Text>{' '}
  самостоятельно составляйте формы глаголов на иврите,
  выбирая буквы в правильном порядке. Инфинитив, корень
  и биньян помогают вспомнить нужную форму, а система
  из трёх попыток постепенно открывает подсказки.
  Такая практика укрепляет память, улучшает правописание
  и помогает быстрее воспроизводить глаголы без готовых
  вариантов ответа.
</Text>


{/* Предлоги */}
<Text style={styles.modalTitle}>ГЛАГОЛЫ И ПРЕДЛОГИ</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Предлоги 1» —
  </Text>{' '}
  тренировка основных предлогов, которые употребляются с глаголами
  в повседневном иврите.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Предлоги 2» —
  </Text>{' '}
  более сложная практика сочетаний глаголов и предлогов.
  Она помогает запоминать не отдельные слова, а естественные конструкции.
</Text>

{/* Однокоренные глаголы */}
<Text style={styles.modalTitle}>ОДНОКОРЕННЫЕ ГЛАГОЛЫ</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Однокоренные глаголы» —
  </Text>{' '}
  сравнивайте глаголы с одним корнем в разных биньянах и наблюдайте,
  как изменение биньяна связано с изменением значения глагола.
</Text>

{/* Совет */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• Совет:</Text>{' '}
  начинайте с запоминания глаголов и базовых форм, затем переходите
  к спряжению, предлогам и предложениям. Так новые формы постепенно
  начинают использоваться автоматически.
</Text>

{/* Финальный блок */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    Регулярная практика в Verbify помогает не только запоминать глаголы,
    но и быстрее узнавать их формы, правильно использовать их в предложениях
    и лучше понимать живой иврит.
  </Text>
</Text>
            </ScrollView>

            {/* Кнопка закрытия */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.button} onPress={onToggle}>
                <Text style={styles.textStyle}>Закрыть</Text>
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

  // 🔹 Цветовые акценты:
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
    color: '#8E24AA', // фиолетовый для важных терминов (биньяны, императивы, начинающие)
  },
  highlightFinal: {
    color: '#D81B60', // яркий фуксия для финальной мотивационной фразы
  },

  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2D4769',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
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
