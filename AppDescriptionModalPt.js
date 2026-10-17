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
  O Verbify é uma{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    ferramenta prática para treinar e aprender verbos em hebraico
  </Text>
  . Ele ajuda a memorizar verbos, compreender os binyanim, praticar a conjugação,
  aprender combinações de verbos com preposições e usar corretamente
  os verbos em frases.
</Text>

<Text style={styles.modalText}>
  O aplicativo é indicado tanto para quem já possui{' '}
  <Text style={[styles.bold, styles.highlightMain]}>
    conhecimentos básicos de hebraico
  </Text>
  , quanto para iniciantes que querem aprender gradualmente os verbos
  mais frequentes e suas diferentes formas.
</Text>

{/* Cartões de verbos */}
<Text style={styles.modalTitle}>CARTÕES DE VERBOS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Cartões de verbos —
  </Text>{' '}
  uma forma rápida e prática de consultar um verbo, sua tradução,
  seu binyan e suas diferentes formas de conjugação.
</Text>

{/* Exercícios */}
<Text style={styles.modalTitle}>EXERCÍCIOS</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercícios 1 e 2 —
  </Text>{' '}
  ajudam a memorizar mais de 400 verbos essenciais em hebraico e a relacionar
  cada verbo escrito ao seu significado.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercício 3 —
  </Text>{' '}
  prática para identificar o binyan de um verbo hebraico.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercício 4 —
  </Text>{' '}
  prática do imperativo em hebraico.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercícios 5 e 6 —
  </Text>{' '}
  exercícios principais para praticar a conjugação dos verbos em hebraico.
  A prática regular ajuda a escolher automaticamente a forma correta
  do verbo.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercícios 7 e 8 —
  </Text>{' '}
  prática de conjugação mais avançada para quem já domina
  os exercícios básicos.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercício 9 «O verbo na frase» —
  </Text>{' '}
  escolha a forma correta do verbo de acordo com o contexto da frase.
  Preste atenção ao tempo, à pessoa, ao número e ao gênero.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • Exercício 10 «Ouça e compreenda» —
  </Text>{' '}
  ouça frases em hebraico e escolha a tradução correta.
  Este exercício desenvolve a compreensão auditiva.
</Text>

{/* Preposições */}
<Text style={styles.modalTitle}>VERBOS E PREPOSIÇÕES</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Preposições 1» —
  </Text>{' '}
  prática das preposições mais frequentes usadas com verbos
  no hebraico do dia a dia.
</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Preposições 2» —
  </Text>{' '}
  prática mais avançada de combinações entre verbos e preposições.
  Ajuda a aprender combinações naturais em vez de palavras isoladas.
</Text>

{/* Verbos da mesma raiz */}
<Text style={styles.modalTitle}>VERBOS DA MESMA RAIZ</Text>

<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightExercise]}>
    • «Verbos da mesma raiz» —
  </Text>{' '}
  compare verbos que compartilham a mesma raiz em diferentes binyanim
  e observe como a mudança de binyan pode alterar o significado do verbo.
</Text>

{/* Dica */}
<Text style={styles.listItem}>
  <Text style={[styles.bold, styles.highlightTip]}>• Dica:</Text>{' '}
  comece aprendendo os verbos e suas formas básicas e depois avance
  para a conjugação, as preposições e as frases. Assim, as formas corretas
  passam a ser reconhecidas e usadas de maneira cada vez mais rápida
  e automática.
</Text>

{/* Bloco final */}
<Text style={styles.finalText}>
  <Text style={[styles.bold, styles.highlightFinal]}>
    A prática regular com o Verbify ajuda não apenas a memorizar verbos
    em hebraico, mas também a reconhecer suas formas mais rapidamente,
    usá-los corretamente em frases e compreender melhor o hebraico falado.
  </Text>
</Text>

            </ScrollView>

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
    color: '#1C3F60', // тёмно-синий заголовок
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

  // 🔹 Цветовые акценты
  highlightMain: {
    color: '#0F4C81', // ключевые идеи / общий смысл
  },
  highlightExercise: {
    color: '#C8502D', // блоки об упражнениях
  },
  highlightTip: {
    color: '#00796B', // советы
  },
  highlightAccent: {
    color: '#8E24AA', // особые термины / группы
  },
  highlightFinal: {
    color: '#D81B60', // яркий финальный вывод
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
