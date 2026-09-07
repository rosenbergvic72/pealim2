import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import LottieView from 'lottie-react-native';

import { getStatistics } from './stat';

const DEFAULT_EXERCISE_ID =
  'prepositionPronouns';

const LANGUAGE_ALIASES = {
  ru: 'ru',
  russian: 'ru',
  русский: 'ru',

  en: 'en',
  english: 'en',

  fr: 'fr',
  french: 'fr',
  français: 'fr',
  francais: 'fr',

  es: 'es',
  spanish: 'es',
  español: 'es',
  espanol: 'es',

  pt: 'pt',
  portuguese: 'pt',
  português: 'pt',
  portugues: 'pt',
  'pt-pt': 'pt',

  ar: 'ar',
  arabic: 'ar',
  arab: 'ar',
  العربية: 'ar',

  am: 'am',
  amharic: 'am',
  አማርኛ: 'am',

  he: 'he',
  iw: 'he',
  hebrew: 'he',
  עברית: 'he',
};

const normalizeLanguage = language => {
  const normalized = String(
    language || ''
  )
    .trim()
    .toLowerCase();

  return (
    LANGUAGE_ALIASES[
      normalized
    ] || 'en'
  );
};

const TEXTS = {
  ru: {
    title:
      'СТАТИСТИКА УПРАЖНЕНИЯ',

    timesCompleted:
      'ВЫПОЛНЕНО РАЗ',

    bestScore:
      'ЛУЧШИЙ РЕЗУЛЬТАТ, %',

    averageScore:
      'СРЕДНИЙ РЕЗУЛЬТАТ, %',

    noStats:
      'Статистика пока не найдена.',

    close:
      'ЗАКРЫТЬ',

    shareTitle:
      'Статистика упражнения',

    shareError:
      'Ошибка при отправке статистики:',

    loadingError:
      'Не удалось загрузить статистику:',

    noData:
      'Н/Д',
  },

  en: {
    title:
      'EXERCISE STATISTICS',

    timesCompleted:
      'TIMES COMPLETED',

    bestScore:
      'BEST RESULT, %',

    averageScore:
      'AVERAGE RESULT, %',

    noStats:
      'No statistics found yet.',

    close:
      'CLOSE',

    shareTitle:
      'Exercise statistics',

    shareError:
      'Error sharing statistics:',

    loadingError:
      'Failed to load statistics:',

    noData:
      'N/A',
  },

  fr: {
    title:
      'STATISTIQUES DE L’EXERCICE',

    timesCompleted:
      'NOMBRE DE RÉALISATIONS',

    bestScore:
      'MEILLEUR RÉSULTAT, %',

    averageScore:
      'RÉSULTAT MOYEN, %',

    noStats:
      'Aucune statistique disponible.',

    close:
      'FERMER',

    shareTitle:
      'Statistiques de l’exercice',

    shareError:
      'Erreur lors du partage des statistiques :',

    loadingError:
      'Impossible de charger les statistiques :',

    noData:
      'N/D',
  },

  es: {
    title:
      'ESTADÍSTICAS DEL EJERCICIO',

    timesCompleted:
      'VECES COMPLETADO',

    bestScore:
      'MEJOR RESULTADO, %',

    averageScore:
      'RESULTADO MEDIO, %',

    noStats:
      'Todavía no hay estadísticas.',

    close:
      'CERRAR',

    shareTitle:
      'Estadísticas del ejercicio',

    shareError:
      'Error al compartir las estadísticas:',

    loadingError:
      'No se pudieron cargar las estadísticas:',

    noData:
      'N/D',
  },

  pt: {
    title:
      'ESTATÍSTICAS DO EXERCÍCIO',

    timesCompleted:
      'VEZES CONCLUÍDO',

    bestScore:
      'MELHOR RESULTADO, %',

    averageScore:
      'RESULTADO MÉDIO, %',

    noStats:
      'Ainda não existem estatísticas.',

    close:
      'FECHAR',

    shareTitle:
      'Estatísticas do exercício',

    shareError:
      'Erro ao partilhar as estatísticas:',

    loadingError:
      'Não foi possível carregar as estatísticas:',

    noData:
      'N/D',
  },

  ar: {
    title:
      'إحصائيات التمرين',

    timesCompleted:
      'عدد مرات إكمال التمرين',

    bestScore:
      'أفضل نتيجة، %',

    averageScore:
      'متوسط النتيجة، %',

    noStats:
      'لا توجد إحصائيات حتى الآن.',

    close:
      'إغلاق',

    shareTitle:
      'إحصائيات التمرين',

    shareError:
      'حدث خطأ أثناء مشاركة الإحصائيات:',

    loadingError:
      'تعذر تحميل الإحصائيات:',

    noData:
      'غير متاح',
  },

  am: {
    title:
      'የልምምድ ስታቲስቲክስ',

    timesCompleted:
      'የተጠናቀቀበት ብዛት',

    bestScore:
      'ከፍተኛ ውጤት፣ %',

    averageScore:
      'አማካይ ውጤት፣ %',

    noStats:
      'እስካሁን ስታቲስቲክስ የለም።',

    close:
      'ዝጋ',

    shareTitle:
      'የልምምድ ስታቲስቲክስ',

    shareError:
      'ስታቲስቲክሱን ማጋራት አልተቻለም፦',

    loadingError:
      'ስታቲስቲክሱን መጫን አልተቻለም፦',

    noData:
      'የለም',
  },

  he: {
    title:
      'סטטיסטיקת התרגיל',

    timesCompleted:
      'מספר השלמות',

    bestScore:
      'התוצאה הטובה ביותר, %',

    averageScore:
      'תוצאה ממוצעת, %',

    noStats:
      'עדיין אין נתונים סטטיסטיים.',

    close:
      'סגירה',

    shareTitle:
      'סטטיסטיקת התרגיל',

    shareError:
      'שגיאה בשיתוף הסטטיסטיקה:',

    loadingError:
      'לא ניתן לטעון את הסטטיסטיקה:',

    noData:
      'אין נתונים',
  },
};

const EXERCISE_SUBTITLES = {
  prepositionPronouns: {
    ru:
      'ПРЕДЛОГИ С МЕСТОИМЕННЫМИ СУФФИКСАМИ',

    en:
      'PREPOSITIONS WITH PRONOMINAL SUFFIXES',

    fr:
      'PRÉPOSITIONS AVEC SUFFIXES PRONOMINAUX',

    es:
      'PREPOSICIONES CON SUFIJOS PRONOMINALES',

    pt:
      'PREPOSIÇÕES COM SUFIXOS PRONOMINAIS',

    ar:
      'حروف الجر المتصلة بضمائر',

    am:
      'ከተውላጠ ስም ቅጥያዎች ጋር የሚጣመሩ መስተዋድዶች',

    he:
      'מילות יחס עם סיומות כינוי',
  },

  prepositionAfterVerbs: {
    ru:
      'ПРЕДЛОГИ ПОСЛЕ ГЛАГОЛОВ И ПРЕДЛОГИ-ПРИСТАВКИ',

    en:
      'PREPOSITIONS AFTER VERBS AND PREFIX PREPOSITIONS',

    fr:
      'PRÉPOSITIONS APRÈS LES VERBES ET PRÉPOSITIONS PRÉFIXÉES',

    es:
      'PREPOSICIONES DESPUÉS DE VERBOS Y PREPOSICIONES PREFIJADAS',

    pt:
      'PREPOSIÇÕES DEPOIS DOS VERBOS E PREPOSIÇÕES PREFIXADAS',

    ar:
      'حروف الجر بعد الأفعال وحروف الجر المتصلة',

    am:
      'ከግሶች በኋላ የሚመጡ እና ተያያዥ መስተዋድዶች',

    he:
      'מילות יחס אחרי פעלים ומילות יחס צמודות',
  },
};

const formatScore = (
  value,
  fallback
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return numericValue.toFixed(
    2
  );
};

const PrepositionStatModal = ({
  visible,
  onToggle,
  onClose,
  language,
  exerciseId =
    DEFAULT_EXERCISE_ID,
}) => {
  const [stats, setStats] =
    useState(null);

  const [name, setName] =
    useState('');

  const [
    animationFinished,
    setAnimationFinished,
  ] = useState(false);

  const viewRef =
    useRef(null);

  const contentOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const normalizedLanguage =
    normalizeLanguage(
      language
    );

  const text =
    TEXTS[
      normalizedLanguage
    ] || TEXTS.en;

  const subtitle =
    EXERCISE_SUBTITLES[
      exerciseId
    ]?.[
      normalizedLanguage
    ] ||
    EXERCISE_SUBTITLES[
      exerciseId
    ]?.en ||
    EXERCISE_SUBTITLES[
      DEFAULT_EXERCISE_ID
    ][normalizedLanguage] ||
    EXERCISE_SUBTITLES[
      DEFAULT_EXERCISE_ID
    ].en;

  const isRTL =
    normalizedLanguage ===
      'ar' ||
    normalizedLanguage ===
      'he';

  const closeModal =
    onToggle ||
    onClose ||
    (() => {});

  const textDirectionStyle =
    useMemo(
      () => ({
        textAlign:
          isRTL
            ? 'right'
            : 'left',

        writingDirection:
          isRTL
            ? 'rtl'
            : 'ltr',
      }),
      [isRTL]
    );

  useEffect(() => {
    if (!visible) {
      setStats(null);
      setAnimationFinished(
        false
      );

      contentOpacity.setValue(
        0
      );

      return undefined;
    }

    let isMounted = true;

    setStats(null);
    setAnimationFinished(false);
    contentOpacity.setValue(0);

    const fetchData =
      async () => {
        try {
          const [
            retrievedStats,
            storedName,
          ] =
            await Promise.all([
              getStatistics(
                exerciseId
              ),

              AsyncStorage.getItem(
                'name'
              ),
            ]);

          if (!isMounted) {
            return;
          }

          setStats(
            retrievedStats ||
              null
          );

          setName(
            storedName || ''
          );
        } catch (error) {
          console.log(
            text.loadingError,
            error
          );

          if (isMounted) {
            setStats(null);
          }
        }
      };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    visible,
    exerciseId,
    contentOpacity,
    text.loadingError,
  ]);

  const handleAnimationFinish =
    () => {
      setAnimationFinished(
        true
      );

      Animated.timing(
        contentOpacity,
        {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }
      ).start();
    };

  const handleShare =
    async () => {
      try {
        const sharingAvailable =
          await Sharing.isAvailableAsync();

        if (
          !sharingAvailable
        ) {
          console.log(
            'Sharing is not available on this device.'
          );

          return;
        }

        const uri =
          await captureRef(
            viewRef,
            {
              format: 'png',
              quality: 0.9,
            }
          );

        await Sharing.shareAsync(
          uri,
          {
            dialogTitle:
              text.shareTitle,

            mimeType:
              'image/png',
          }
        );
      } catch (error) {
        console.log(
          text.shareError,
          error
        );
      }
    };

  const averageScore =
    stats?.averageScore ??
    stats?.averageCompletionRate;

  const bestScore =
    stats?.bestScore;

  const timesCompleted =
    Number(
      stats?.timesCompleted ??
        0
    );

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={
        closeModal
      }
      statusBarTranslucent
    >
      <View
        style={
          styles.centeredView
        }
      >
        <View
          ref={viewRef}
          collapsable={false}
          style={
            styles.modalView
          }
        >
          {!animationFinished && (
            <LottieView
              source={require(
                './assets/Animation - 1718461626409.json'
              )}
              autoPlay
              loop={false}
              onAnimationFinish={
                handleAnimationFinish
              }
              style={
                styles.lottie
              }
            />
          )}

          <Animated.View
            style={[
              styles.animatedContent,

              {
                opacity:
                  animationFinished
                    ? contentOpacity
                    : 0,
              },
            ]}
          >
            <View
              style={
                styles.headerContainer
              }
            >
              <Image
                source={require(
                  './VERBIFY.png'
                )}
                style={
                  styles.image
                }
                resizeMode="contain"
              />

              {!!name && (
                <Text
                  style={[
                    styles.greeting,

                    isRTL &&
                      styles.centerRTL,
                  ]}
                  maxFontSizeMultiplier={
                    1.2
                  }
                >
                  {name},
                </Text>
              )}
            </View>

            <Text
              style={
                styles.modalTitle
              }
              maxFontSizeMultiplier={
                1.2
              }
            >
              {text.title}
            </Text>

            <Text
              style={
                styles.subtitle
              }
              maxFontSizeMultiplier={
                1.15
              }
            >
              {subtitle}
            </Text>

            {stats ? (
              <View
                style={
                  styles.statsContainer
                }
              >
                <View
                  style={[
                    styles.row,

                    isRTL &&
                      styles.rowRTL,
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      textDirectionStyle,
                    ]}
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {
                      text.timesCompleted
                    }
                  </Text>

                  <Text
                    style={
                      styles.number
                    }
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {timesCompleted}
                  </Text>
                </View>

                <View
                  style={[
                    styles.row,

                    isRTL &&
                      styles.rowRTL,
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      textDirectionStyle,
                    ]}
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {
                      text.bestScore
                    }
                  </Text>

                  <Text
                    style={
                      styles.number
                    }
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {formatScore(
                      bestScore,
                      text.noData
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.row,

                    isRTL &&
                      styles.rowRTL,
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      textDirectionStyle,
                    ]}
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {
                      text.averageScore
                    }
                  </Text>

                  <Text
                    style={
                      styles.number
                    }
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {formatScore(
                      averageScore,
                      text.noData
                    )}
                  </Text>
                </View>
              </View>
            ) : (
              <Text
                style={
                  styles.statsText
                }
                maxFontSizeMultiplier={
                  1.2
                }
              >
                {text.noStats}
              </Text>
            )}

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={
                closeModal
              }
              activeOpacity={0.75}
            >
              <Text
                style={
                  styles.closeButtonText
                }
                maxFontSizeMultiplier={
                  1.2
                }
              >
                {text.close}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.shareButton
              }
              onPress={
                handleShare
              }
              activeOpacity={0.75}
            >
              <Image
                source={require(
                  './share4.png'
                )}
                style={
                  styles.shareIcon
                }
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles =
  StyleSheet.create({
    centeredView: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        'rgba(0,0,0,0.35)',

      paddingHorizontal: 18,
    },

    modalView: {
      width: '100%',
      maxWidth: 420,
      minHeight: 420,

      backgroundColor:
        '#FFF0E4',

      borderRadius: 20,
      padding: 16,

      alignItems:
        'center',

      shadowColor:
        '#000',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.25,

      shadowRadius:
        3.84,

      elevation: 5,
    },

    animatedContent: {
      width: '100%',
    },

    lottie: {
      width: '100%',
      height: 300,

      position:
        'absolute',

      top: '45%',

      transform: [
        {
          translateY: -100,
        },
      ],
    },

    headerContainer: {
      alignItems:
        'center',

      marginBottom: 5,
    },

    image: {
      width: 100,
      height: 100,
    },

    greeting: {
      fontSize: 22,
      fontWeight:
        'bold',

      color:
        '#2D4769',

      marginBottom: 8,

      textAlign:
        'center',
    },

    centerRTL: {
      writingDirection:
        'rtl',
    },

    modalTitle: {
      marginBottom: 5,

      fontWeight:
        'bold',

      textAlign:
        'center',

      fontSize: 16,

      color:
        '#2D4769',
    },

    subtitle: {
      marginBottom: 14,

      paddingHorizontal: 8,

      fontWeight:
        '700',

      textAlign:
        'center',

      fontSize: 12,
      lineHeight: 17,

      color:
        '#6B708A',
    },

    statsText: {
      marginVertical: 20,

      fontWeight:
        'bold',

      textAlign:
        'center',

      fontSize: 15,

      color:
        '#2D4769',
    },

    statsContainer: {
      width: '100%',
    },

    row: {
      minHeight: 50,

      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 7,

      backgroundColor:
        '#E7EAF4',

      padding: 6,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        '#D1D1D1',
    },

    rowRTL: {
      flexDirection:
        'row-reverse',
    },

    label: {
      width: '72%',

      paddingHorizontal: 5,

      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        'bold',

      color:
        '#2B3270',
    },

    number: {
      width: '28%',
      minHeight: 36,

      paddingHorizontal: 4,
      paddingVertical: 7,

      borderRadius: 10,

      overflow:
        'hidden',

      color:
        '#FFFFFF',

      backgroundColor:
        '#2D4769',

      fontSize: 15,

      fontWeight:
        'bold',

      textAlign:
        'center',
    },

    closeButton: {
      width: '50%',
      minHeight: 46,

      alignSelf:
        'center',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 12,

      paddingHorizontal: 12,

      borderRadius: 10,

      backgroundColor:
        '#2D4769',

      elevation: 2,
    },

    closeButtonText: {
      color:
        '#FFFFFF',

      fontWeight:
        'bold',

      textAlign:
        'center',

      fontSize: 14,
    },

    shareButton: {
      marginTop: 14,

      alignItems:
        'center',
    },

    shareIcon: {
      width: 46,
      height: 46,
    },
  });

export default PrepositionStatModal;