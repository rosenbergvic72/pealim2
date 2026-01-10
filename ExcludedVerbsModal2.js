// ExcludedVerbsModal2.js (restore-only)
import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const STR = {
  ru: {
    title: 'Исключённые глаголы',
    subtitle: 'Эти глаголы не будут попадать в новые задания упражнения.',
    empty: 'Список пуст.',
    restore: 'Вернуть',
    close: 'Закрыть',
  },
  en: {
    title: 'Excluded verbs',
    subtitle: 'These verbs will not appear in new exercise tasks.',
    empty: 'The list is empty.',
    restore: 'Restore',
    close: 'Close',
  },
  fr: {
    title: 'Verbes exclus',
    subtitle: 'Ces verbes n’apparaîtront pas dans les nouveaux exercices.',
    empty: 'La liste est vide.',
    restore: 'Restaurer',
    close: 'Fermer',
  },
  es: {
    title: 'Verbos excluidos',
    subtitle: 'Estos verbos no aparecerán en nuevos ejercicios.',
    empty: 'La lista está vacía.',
    restore: 'Restaurar',
    close: 'Cerrar',
  },
  pt: {
    title: 'Verbos excluídos',
    subtitle: 'Estes verbos não aparecerão em novos exercícios.',
    empty: 'A lista está vazia.',
    restore: 'Restaurar',
    close: 'Fechar',
  },
  ar: {
    title: 'الأفعال المستبعدة',
    subtitle: 'لن تظهر هذه الأفعال في التمارين الجديدة.',
    empty: 'القائمة فارغة.',
    restore: 'إرجاع',
    close: 'إغلاق',
  },
  am: {
    title: 'የተወገዱ ግሶች',
    subtitle: 'እነዚህ ግሶች በአዲስ ልምምዶች ውስጥ አይታዩም።',
    empty: 'ዝርዝሩ ባዶ ነው።',
    restore: 'መመለስ',
    close: 'መዝጋት',
  },
};

const isRTLLang = (lang) => lang === 'ar';

const ExcludedVerbsModal2 = ({
  visible,
  onClose,
  excludedIds = [],
  verbsData = [], // ожидаем: [{hebrewVerb, transliteration, translation}]
  onRestoreVerb, // (hebrewVerb) => void
  lang = 'ru',
}) => {
  const t = STR[lang] || STR.ru;
  const rtl = isRTLLang(lang);

  const excludedSet = useMemo(() => new Set((excludedIds || []).map(String)), [excludedIds]);

  const excludedVerbs = useMemo(() => {
    return (verbsData || [])
      .filter((v) => excludedSet.has(String(v?.hebrewVerb || '')))
      .sort((a, b) => String(a?.hebrewVerb || '').localeCompare(String(b?.hebrewVerb || ''), 'he'));
  }, [verbsData, excludedSet]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.headerRow, rtl && styles.rowRtl]}>
            <Text style={[styles.title, rtl && styles.textRtl]} maxFontSizeMultiplier={1.2}>
              {t.title}
            </Text>

            {/* <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeText} maxFontSizeMultiplier={1.2}>
                ✕
              </Text>
            </TouchableOpacity> */}
          </View>

          <Text style={[styles.subtitle, rtl && styles.textRtl]} maxFontSizeMultiplier={1.2}>
            {t.subtitle}
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 10 }}>
            {excludedVerbs.length === 0 ? (
              <Text style={[styles.empty, rtl && styles.textRtl]} maxFontSizeMultiplier={1.2}>
                {t.empty}
              </Text>
            ) : (
              excludedVerbs.map((v) => {
                const id = String(v?.hebrewVerb || '');
                return (
                  <View key={id} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={[styles.he, rtl && styles.textRtl]} maxFontSizeMultiplier={1.2}>
                        {v.hebrewVerb}
                      </Text>

                      {!!v.transliteration && (
                        <Text style={[styles.tr, rtl && styles.textRtl]} maxFontSizeMultiplier={1.2}>
                          {v.transliteration}
                        </Text>
                      )}

                      <Text style={[styles.translation, rtl && styles.textRtl]} maxFontSizeMultiplier={1.2}>
                        {v.translation || '—'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => onRestoreVerb?.(id)}
                      style={[styles.btn, styles.btnRestore]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnText} maxFontSizeMultiplier={1.2}>
                        {t.restore}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.bottomClose} activeOpacity={0.85}>
            <Text style={styles.bottomCloseText} maxFontSizeMultiplier={1.2}>
              {t.close}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ExcludedVerbsModal2;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('0.8%'),
  },
  rowRtl: { flexDirection: 'row-reverse' },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333652',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9E9E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#152039',
  },
  subtitle: {
    fontSize: 14,
    color: '#152039',
    marginBottom: hp('0.8%'),
  },
  list: {
    marginTop: hp('0.3%'),
  },
  empty: {
    textAlign: 'center',
    color: '#152039',
    marginTop: hp('1.8%'),
    fontWeight: 'bold',
  },

  row: {
    borderRadius: wp('2.3%'),
    backgroundColor: '#FFFFFF',
    paddingVertical: hp('0.9%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('0.8%'),
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  rowText: {
    marginBottom: hp('0.7%'),
  },
  he: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#333652',
    textAlign: 'left',
  },
  tr: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#CE6857',
    marginTop: 1,
  },
  translation: {
    fontSize: 16,
    color: '#013eccff',
    marginTop: 1,
    fontWeight: 'bold',
  },

  btn: {
    paddingVertical: hp('0.85%'),
    borderRadius: wp('2.3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRestore: {
    backgroundColor: '#2e3255ff',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  bottomClose: {
    marginTop: hp('0.9%'),
    backgroundColor: '#a7a7a7ff',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.15%'),
    alignItems: 'center',
  },
  bottomCloseText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#152039',
  },

  textRtl: { textAlign: 'right' },
});
