// VerbCard2Es.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import TypewriterTextLTR from './TypewriterTextLTR';

const VerbCard2Am = ({
  verbData,

  // ✅ как в VerbCard1
  isExcluded = false,
  isPinned = false,
  onExcludePress,
  onPinTogglePress,
  onOpenManageModal,
}) => {
  if (!verbData) return null;

  return (
    <View style={styles.cardContainer}>
      <TypewriterTextLTR
        text={verbData.verbAmharic}
        typingSpeed={40}
        style={styles.verbSpanish}
        maxFontSizeMultiplier={1.2}
      />

      {/* ✅ те же кнопки, что в VerbCard1 (столбиком) */}
      <View style={styles.sideButtonsColumn} pointerEvents="box-none">
        <TouchableOpacity
          onPress={onExcludePress}
          style={styles.smallIconBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image
            source={isExcluded ? require('./glaz2.png') : require('./glaz1.png')}
            style={styles.smallIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPinTogglePress}
          style={styles.smallIconBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image
            source={isPinned ? require('./gant2.png') : require('./gant1.png')}
            style={styles.smallIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenManageModal}
          style={styles.smallIconBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image source={require('./spisok.png')} style={styles.smallIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
 cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', // ✅ ВОТ ЭТО ГЛАВНОЕ
    padding: 5,
    height: 146,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#D1E3F1',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,

    position: 'relative',
    zIndex: 1,
  },
  verbSpanish: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#152039',
    textAlign: 'center',
  },

  // ✅ колонка кнопок справа
sideButtonsColumn: {
  position: 'absolute',
  right: wp('1.5%'),
  top: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  gap: 7,
  zIndex: 60,
  elevation: 60,
},
  smallIconBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default VerbCard2Am;
