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
  
            {/* Logotipo */}
            <View style={styles.logoContainer}>
              <Image source={require('./VERBIFY.png')} style={styles.logo} />
            </View>
  
            {/* Título */}
            <Text style={styles.modalTitle}>DESCRIÇÃO DO APLICATIVO</Text>
  
            <Text style={styles.modalText}>
              Este é um <Text style={styles.bold}>treinador e ferramenta eficaz</Text> para aqueles que já estão estudando hebraico,
              têm <Text style={styles.bold}>conhecimento básico,</Text> querem
              <Text style={styles.bold}>aprender a conjugar verbos de forma rápida e correta</Text> ou <Text style={styles.bold}>melhorar esta habilidade</Text>.
              O aplicativo também é útil para <Text style={styles.bold}>iniciantes</Text>, pois inclui exercícios
              para <Text style={styles.bold}>memorizar verbos</Text>, suas formas, <Text style={styles.bold}>binyanim</Text> e
              <Text style={styles.bold}>praticar o uso do modo imperativo (imperativos)</Text>.
            </Text>
  
            {/* Exercícios Principais */}
            <Text style={styles.modalTitle}>EXERCÍCIOS PRINCIPAIS</Text>
  
            <Text style={styles.modalText}>
              <Text style={styles.bold}>A conjugação de verbos é uma parte fundamental do aplicativo.</Text>
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Exercícios 5 e 6 -</Text> estas são as principais tarefas para praticar a conjugação. Recomendamos fazê-las regularmente até que a habilidade se torne automática.
  
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Exercícios 7 e 8 -</Text> versões avançadas dos exercícios 5 e 6. Eles são projetados para aqueles que já alcançaram resultados confiantes e desejam levar sua prática para o próximo nível.
  
            </Text>
  
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Dica:</Text> primeiro pratique a conjugação nos exercícios 5 e 6, e depois passe para os mais complexos 7 e 8!
  
            </Text>
  
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Exercícios para aprender o básico.</Text>
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Exercícios 1 e 2 -</Text> ajudam a memorizar cerca de 300 verbos chave e suas formas básicas.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Exercício 3 -</Text> prática para determinar o binyan de um verbo (conhecimento básico é necessário).
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Exercício 4 -</Text> treinador para praticar o modo imperativo em hebraico.
            </Text>
  
            {/* Bloco final */}
            <Text style={styles.finalText}>
              <Text style={styles.bold}>A prática constante de exercícios estabelece uma base sólida para o uso correto de verbos e suas conjugações na fala cotidiana!</Text>
            </Text>
  
          </ScrollView>
  
          {/* Botão de fechar */}
          {/* <TouchableOpacity style={styles.button} onPress={onToggle}>
            <Text style={styles.textStyle}>Fechar</Text>
          </TouchableOpacity> */}
  
        {/* Fixed Close Button */}
                    <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={onToggle}>
            <Text style={styles.textStyle}>Fechar</Text>
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
