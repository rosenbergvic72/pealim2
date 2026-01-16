// VerbCard3En.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import LottieView from 'lottie-react-native';

// ✅ super-safe: keeps only latin letters -> HITPA'EL / HITPAEL / hitpa-el all become "hitpael"
const normalizeBinyan = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, '');

const DEFAULT_TYPING_SPEED = 100;

/* ===================== Highlight helpers ===================== */

const getHebrewLetterPositions = (raw) => {
  const pos = [];
  for (let i = 0; i < raw.length; i++) {
    if (/[א-ת]/.test(raw[i])) pos.push(i);
  }
  return pos;
};

// ✅ HITPA'EL rule change:
// if 2nd+3rd hebrew letters are "הת" -> highlight 2 & 3
// else -> highlight 2 & 4
// HIF'IL / NIF'AL -> highlight 2
const getTargetsForBinyan = (rawHeb, binKey) => {
  if (!rawHeb) return null;

  if (binKey === 'hitpael') {
    const hebPos = getHebrewLetterPositions(rawHeb);
    const p2 = hebPos[1];
    const p3 = hebPos[2];
    const p4 = hebPos[3];

    if (typeof p2 !== 'number') return null;

    const second = typeof p2 === 'number' ? rawHeb[p2] : '';
    const third = typeof p3 === 'number' ? rawHeb[p3] : '';
    const isHetTav = second === 'ה' && third === 'ת';

    if (isHetTav) return [2, 3];
    return typeof p4 === 'number' ? [2, 4] : [2];
  }

  if (binKey === 'hifil' || binKey === 'nifal' || binKey === 'nifaal') return [2];

  return null;
};

const computeHighlightPositionsSet = (rawHeb, binKey) => {
  const raw = String(rawHeb || '');
  if (!raw) return null;

  const targets = getTargetsForBinyan(raw, binKey);
  if (!targets) return null;

  const hebPos = getHebrewLetterPositions(raw);
  const set = new Set(
    targets.map((n) => hebPos[n - 1]).filter((p) => typeof p === 'number')
  );

  return set.size ? set : null;
};

// ✅ Render "partial typed text" with highlight
const renderTypedWithHighlight = (typedText, highlightSet, highlightEnabled) => {
  const t = String(typedText || '');
  if (!highlightEnabled || !highlightSet || !highlightSet.size) return t;

  return (
    <>
      {Array.from(t).map((ch, idx) => {
        const hi = highlightSet.has(idx);
        return (
          <Text key={idx} style={hi ? styles.prefixYellow : null}>
            {ch}
          </Text>
        );
      })}
    </>
  );
};

/* ===================== Root highlighting (HITPA'EL only) ===================== */

const HITPAEL_ROOT_SPECIALS = new Set(['ש', 'ס', 'ז', 'צ']);

// ✅ NEW: root highlight also depends on highlightEnabled
const renderRootWithOptionalHighlight = (rootRaw, isHitpael, highlightEnabled) => {
  const r = String(rootRaw || '');
  if (!r) return '';

  // if highlight disabled -> NEVER highlight in root
  if (!highlightEnabled) return r;

  // only HITPA'EL can have this root highlight
  if (!isHitpael) return r;

  // find first Hebrew letter in root (ignore spaces/dashes)
  const m = r.match(/[א-ת]/);
  if (!m || typeof m.index !== 'number') return r;

  const i = m.index;
  const firstHeb = r[i];

  if (!HITPAEL_ROOT_SPECIALS.has(firstHeb)) return r;

  const before = r.slice(0, i);
  const after = r.slice(i + 1);

  return (
    <>
      {!!before && <Text>{before}</Text>}
      <Text style={styles.prefixYellow}>{firstHeb}</Text>
      {!!after && <Text>{after}</Text>}
    </>
  );
};

/* ===================== Typewriter highlighted (no TypewriterTextRTL change) ===================== */

const TypewriterHebrewCardRTL = ({
  text,
  typingSpeed = DEFAULT_TYPING_SPEED,
  style,
  highlightEnabled,
  highlightSet,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef(null);

  // ✅ Re-type ONLY when the word changes
  useEffect(() => {
    const full = String(text || '');
    let i = 0;

    setDisplayedText('');
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      i += 1;
      setDisplayedText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, Math.max(10, Number(typingSpeed) || DEFAULT_TYPING_SPEED));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [text, typingSpeed]);

  return (
    <Text style={[style, { writingDirection: 'rtl' }]} maxFontSizeMultiplier={1.2}>
      {renderTypedWithHighlight(displayedText, highlightSet, highlightEnabled)}
    </Text>
  );
};

/* ===================== Main ===================== */

const VerbCard3En = ({ verbData, soundEnabled, highlightEnabled = true }) => {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const playAudio = async (audioFileName, isAutoPlay = false) => {
    try {
      if (isAutoPlay && !soundEnabled) return;

      const fileNameKey = String(audioFileName || '').replace('.mp3', '');
      const audioFile = sounds[fileNameKey];

      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }

      await sound?.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);

      setIsPlaying(true);
      await newSound.playAsync();
      setTimeout(() => setIsPlaying(false), 1000);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // autoplay infinitive sound
  useEffect(() => {
    if (verbData?.audioFile) playAudio(verbData.audioFile, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verbData, soundEnabled]);

  // lottie
  useEffect(() => {
    if (isPlaying) animationRef.current?.play();
    else animationRef.current?.reset();
  }, [isPlaying]);

  const rawHeb = String(verbData?.hebrewVerb || '');
  const binyanRaw = String(verbData?.binyan || '');
  const binKey = useMemo(() => normalizeBinyan(binyanRaw), [binyanRaw]);
  const isHitpael = binKey === 'hitpael';

  const highlightSet = useMemo(
    () => computeHighlightPositionsSet(rawHeb, binKey),
    [rawHeb, binKey]
  );

  // fades (как было)
  const [opacity2] = useState(new Animated.Value(0));
  const [opacity3] = useState(new Animated.Value(0));
  const [opacity4] = useState(new Animated.Value(0));

  useEffect(() => {
    opacity2.setValue(0);
    opacity3.setValue(0);
    opacity4.setValue(0);

    Animated.timing(opacity2, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setTimeout(
      () => Animated.timing(opacity3, { toValue: 1, duration: 500, useNativeDriver: true }).start(),
      100
    );
    setTimeout(
      () => Animated.timing(opacity4, { toValue: 1, duration: 500, useNativeDriver: true }).start(),
      200
    );
  }, [verbData, opacity2, opacity3, opacity4]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.hebrewVerbContainer}>
        {isPlaying && (
          <LottieView
            ref={animationRef}
            source={require('./assets/Animation - 1718430107767.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
          />
        )}

        {/* ✅ Highlight is INSIDE typing; toggle does NOT retype (typewriter depends only on rawHeb) */}
        <View style={styles.hebrewVerbWrapper}>
          <TypewriterHebrewCardRTL
            text={rawHeb}
            typingSpeed={DEFAULT_TYPING_SPEED}
            style={styles.hebrewVerb}
            highlightEnabled={highlightEnabled}
            highlightSet={highlightSet}
          />
        </View>

        <Animated.Text style={[styles.translit, { opacity: opacity2 }]} maxFontSizeMultiplier={1.2}>
          {verbData?.transliteration}
        </Animated.Text>

        {/* ✅ Root label stays green; value black + bigger; root highlight obeys highlightEnabled */}
        <Animated.Text style={[styles.root, { opacity: opacity3 }]} maxFontSizeMultiplier={1.2}>
          Root:{' '}
          <Text style={styles.rootValue} maxFontSizeMultiplier={1.2}>
            {renderRootWithOptionalHighlight(verbData?.root, isHitpael, highlightEnabled)}
          </Text>
        </Animated.Text>

        <Animated.Text style={[styles.bin, { opacity: opacity4 }]} maxFontSizeMultiplier={1.2}>
          {verbData?.verbEnglish}
        </Animated.Text>

        <TouchableOpacity onPress={() => playAudio(verbData?.audioFile)} style={styles.audioButton}>
          <Image source={require('./speaker3.png')} style={styles.audioIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#FFFDEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  hebrewVerbContainer: {
    alignItems: 'center',
    position: 'relative',
  },

  // stable box (no jumps)
  hebrewVerbWrapper: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hebrewVerb: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333652',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'center',
    lineHeight: 34,
    includeFontPadding: false,
  },

  prefixYellow: {
    color: '#00a2ffff',
    fontWeight: 'bold',
  },

  translit: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CE6857',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 5,
    marginTop: 10,
  },

  root: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7031',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },

  rootValue: {
    color: '#000',
    fontSize: 19,
    fontWeight: 'bold',
  },

  bin: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003882',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 5,
    marginBottom: 10,
  },

  audioButton: {
    marginTop: 10,
    position: 'absolute',
    right: 5,
    bottom: 5,
  },

  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },

  lottieAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
  },
});

export default VerbCard3En;
