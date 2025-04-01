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
              Это <Text style={styles.bold}>эффективный тренажер и инструмент</Text> для тех, кто уже изучает иврит, 
              обладает <Text style={styles.bold}>базовыми знаниями, </Text> хочет 
              <Text style={styles.bold}> научиться быстро и правильно спрягать глаголы</Text> или <Text style={styles.bold}>совершенствовать этот навык</Text>. 
              Приложение также полезно <Text style={styles.bold}>начинающим</Text>, так как включает упражнения 
              для <Text style={styles.bold}>запоминания глаголов</Text>, их форм,<Text style={styles.bold}> биньянов</Text> и 
              <Text style={styles.bold}> тренировки использования повелительного наклонения (императивов)</Text>.
            </Text>

            {/* Основные упражнения */}
            <Text style={styles.modalTitle}>ОСНОВНЫЕ УПРАЖНЕНИЯ</Text>

            <Text style={styles.modalText}>
             <Text style={styles.bold}>Спряжение глаголов – ключевая часть приложения.</Text>
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Упражнения 5 и 6 -</Text> это основные задания для тренировки спряжения. Рекомендуем регулярно выполнять их, пока навык не станет автоматическим.
              
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Упражнения 7 и 8 -</Text> усложненные версии упражнений 5 и 6. Они предназначены для тех, кто уже достиг уверенных результатов и хочет вывести свою практику на новый уровень.
              
            </Text>

            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Совет:</Text> сначала отработайте спряжение в упражнениях 5 и 6, а затем переходите к более сложным 7 и 8! 
              
            </Text>

            <Text style={styles.modalText}>
               <Text style={styles.bold}>Упражнения для изучения основ.</Text>
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Упражнения 1 и 2 -</Text> помогают запомнить около 300 ключевых глаголов и их основные формы.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Упражнение 3 -</Text> тренировка определения биньяна глагола (необходимы базовые знания).
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Упражнение 4 -</Text> тренажер для отработки повелительного наклонения в иврите.
            </Text>

            {/* Финальный блок */}
            <Text style={styles.finalText}>
              <Text style={styles.bold}>Постоянное выполнение упражнений закладывают прочную основу для правильного применения глаголов и их спряжений в повседневной речи!</Text> 
            </Text>

          </ScrollView>

          {/* Кнопка закрытия */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.button} onPress={onToggle}>
              <Text style={styles.textStyle}>Закрыть</Text>
            </TouchableOpacity>
          </View>
          {/* <TouchableOpacity style={styles.button} onPress={onToggle}>
            <Text style={styles.textStyle}>Закрыть</Text>
          </TouchableOpacity> */}

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