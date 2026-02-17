import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';

import verbsData6 from './verbs6RU.json';
import verbsData1 from './verbs1.json';

const SearchModal = ({ visible, onToggle, onSelectVerb }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [didSearch, setDidSearch] = useState(false);

  /* =========================
     Helpers
  ========================= */

  const normalizeHebrew = useCallback((s) => {
    if (!s) return '';
    return String(s)
      .trim()
      .replace(/\s+/g, '')
      .replace(/־/g, '')
      .toLowerCase();
  }, []);

  const pickRussianInf = useCallback((row) => {
    return (
      row?.russian ||
      row?.verbRussian ||
      row?.russianInfinitive ||
      row?.russian_text ||
      row?.russiantext ||
      '—'
    );
  }, []);

  const normalizeBinyan = useCallback((b) => {
    const s = (b || '—').trim();
    return s.length ? s : '—';
  }, []);

  /* =========================
     Build binyan index from verbs1.json
  ========================= */

  const binyanByInfinitiveHebrew = useMemo(() => {
    const map = new Map();
    for (const v of verbsData1 || []) {
      const key = normalizeHebrew(v?.hebrewVerb);
      if (!key) continue;
      if (!map.has(key)) map.set(key, normalizeBinyan(v?.binyan));
    }
    return map;
  }, [normalizeHebrew, normalizeBinyan]);

  /* =========================
     Unique verbs list from verbs6RU
     Sort by binyan → infinitive
  ========================= */

  const allVerbsList = useMemo(() => {
    const groups = new Map();

    for (const row of verbsData6 || []) {
      const hebInf = row?.infinitive;
      const key = normalizeHebrew(hebInf);
      if (!key) continue;

      if (!groups.has(key)) {
        groups.set(key, {
          infinitiveHebrew: hebInf,
          russianInfinitive: pickRussianInf(row),
          sampleRow: row,
        });
      }
    }

    const list = Array.from(groups.values()).map((item) => ({
      ...item,
      binyan:
        binyanByInfinitiveHebrew.get(normalizeHebrew(item.infinitiveHebrew)) ||
        '—',
    }));

    list.sort((a, b) => {
      const bin = String(a.binyan).localeCompare(String(b.binyan), 'en');
      if (bin !== 0) return bin;
      return String(a.infinitiveHebrew).localeCompare(String(b.infinitiveHebrew), 'he');
    });

    return list;
  }, [normalizeHebrew, pickRussianInf, binyanByInfinitiveHebrew]);

  /* =========================
     Binyan background styles
  ========================= */

  const getBinyanRowStyle = useCallback(
    (binyan) => {
      const b = normalizeBinyan(binyan).toUpperCase();

      if (b.includes("PA'AL") || b.includes('PAAL')) return styles.rowPaal;
      if (b.includes("PI'EL") || b.includes('PIEL')) return styles.rowPiel;
      if (b.includes("HIF'IL") || b.includes('HIFIL')) return styles.rowHifil;
      if (b.includes("HITPA'EL") || b.includes('HITPAEL')) return styles.rowHitpael;
      if (b.includes("NIF'AL") || b.includes('NIFAL')) return styles.rowNifal;
      if (b.includes("HUF'AL") || b.includes('HUFAL')) return styles.rowHufal;
      if (b.includes("PU'AL") || b.includes('PUAL')) return styles.rowPual;

      return styles.rowDefault;
    },
    [normalizeBinyan]
  );

  /* =========================
     Lifecycle
  ========================= */

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSearchResults([]);
      setDidSearch(false);
    }
  }, [visible]);

  /* =========================
     Search
  ========================= */

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    setDidSearch(true);

    if (trimmed.length < 3) {
      setSearchResults([]);
      return;
    }

    const q = trimmed.toLowerCase();

    const results = verbsData6.filter((v) =>
      (v.infinitive || '').toLowerCase().includes(q) ||
      (v.russian || '').toLowerCase().includes(q) ||
      (v.russiantext || '').toLowerCase().includes(q) ||
      (v.translit || '').toLowerCase().includes(q) ||
      (v.transliteration || '').toLowerCase().includes(q) ||
      (v.hebrewtext || '').toLowerCase().includes(q)
    );

    setSearchResults(results);
  }, [searchQuery]);

  const handleInputChange = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setSearchResults([]);
      setDidSearch(false);
    }
  };

  const handleSearchPress = () => {
    Keyboard.dismiss();
    handleSearch();
  };

  const handleBlur = () => {
    if (searchQuery.trim().length >= 3) handleSearch();
  };

  const isSearchEnabled = searchQuery.trim().length >= 3;

  /* =========================
     Select actions
  ========================= */

  const handleSearchResultPress = (row) => onSelectVerb(row);
  const handleTableVerbPress = (item) => onSelectVerb(item.sampleRow);

  /* =========================
     UI
  ========================= */

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onToggle}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Глаголы упражнения</Text>

          {/* Search */}
          <TextInput
            style={styles.input}
            // placeholder="Введите слово для поиска (мин. 3 символа)"
            value={searchQuery}
            onChangeText={handleInputChange}
            onBlur={handleBlur}
          />

          <TouchableOpacity
            style={[styles.button, !isSearchEnabled && styles.buttonDisabled]}
            onPress={handleSearchPress}
            disabled={!isSearchEnabled}
          >
            <Text style={styles.buttonText}>Искать</Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search results (only after search) */}
            {didSearch && (
              <>
                <Text style={styles.sectionTitle}>Результаты поиска</Text>

                {searchResults.length === 0 ? (
                  <Text style={styles.emptyText}>Ничего не найдено.</Text>
                ) : (
                  <>
                    <Text style={styles.hintText}>
                      Нажми на результат, чтобы открыть спряжение
                    </Text>

                    {searchResults.map((r, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.resultContainer}
                        onPress={() => handleSearchResultPress(r)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.infinitiveText}>{r.infinitive}</Text>
                        <Text style={styles.russianShortText}>{r.russian}</Text>
                        <Text style={styles.translitMainText}>{r.transliteration}</Text>
                        <Text style={styles.resultTextHebrew}>{r.hebrewtext}</Text>
                        <Text style={styles.russianPhraseText}>{r.russiantext}</Text>
                        <Text style={styles.translitAltText}>{r.translit}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                <View style={styles.divider} />
              </>
            )}

            {/* Verbs list (table style as before) */}
            <Text style={styles.sectionTitle}>Выбери глагол для тренировки</Text>

            {allVerbsList.map((item, idx) => (
              <TouchableOpacity
                key={`${item.infinitiveHebrew}_${idx}`}
                style={[styles.tableRow, getBinyanRowStyle(item.binyan)]}
                onPress={() => handleTableVerbPress(item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tableCell, styles.colHeb]}>
                  {item.infinitiveHebrew}
                </Text>

                <Text style={[styles.tableCell, styles.colBinyan]}>
                  {item.binyan}
                </Text>

                <Text style={[styles.tableCell, styles.colRu]}>
                  {item.russianInfinitive}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onToggle}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* =========================
   Styles
========================= */

const TABLE_FONT = 13;

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalView: {
    width: '94%',
    maxHeight: '88%',
    backgroundColor: '#FFFDEF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2B3270',
    marginBottom: 12,
  },

  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#C3C3C3',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },

  button: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: { backgroundColor: '#9CA9B5' },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  resultsScroll: { width: '100%' },
  resultsContent: { paddingBottom: 10 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2B3270',
    marginBottom: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#C3D1E0',
    marginVertical: 10,
  },

  /* ====== Table header (as before) ====== */
  tableHeader: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#DDE6F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#C3D1E0',
    marginBottom: 6,
  },

  tableRow: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#C3D1E0',
    marginBottom: 6,
    alignItems: 'center',
  },

  tableCell: {
    fontSize: TABLE_FONT,
    color: '#1C3F60',
  },

  colHebHeader: {
    flex: 1.1,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  colBinyanHeader: { flex: 0.8, fontWeight: 'bold', textAlign: 'center' },
  colRuHeader: { flex: 1.1, fontWeight: 'bold', textAlign: 'left' },

  colHeb: {
    flex: 1.1,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#1D3557',
  },
  colBinyan: {
    flex: 0.8,
    textAlign: 'center',
    color: '#0B7285',
    fontWeight: '800',
  },
  colRu: {
    flex: 1.1,
    textAlign: 'left',
    color: '#1C3F60',
    fontWeight: '700',
  },

  /* ====== Backgrounds per binyan ====== */
  rowDefault: { backgroundColor: '#E4ECF5' },
  rowPaal: { backgroundColor: '#E9F7EF' },
  rowPiel: { backgroundColor: '#FEF5E7' },
  rowHifil: { backgroundColor: '#EAF2F8' },
  rowHitpael: { backgroundColor: '#F5EEF8' },
  rowNifal: { backgroundColor: '#FDEDEC' },
  rowHufal: { backgroundColor: '#F4F6F7' },
  rowPual: { backgroundColor: '#FFF9E6' },

  /* ====== Search results ====== */
  hintText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2B3270',
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 6,
  },

  resultContainer: {
    backgroundColor: '#E4ECF5',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#C3D1E0',
    marginBottom: 6,
  },

  infinitiveText: { fontSize: 16, fontWeight: 'bold', color: '#1C3F60' },
  russianShortText: { fontWeight: '600', color: '#1C3F60' },
  translitMainText: { fontStyle: 'italic', color: '#FF5733' },
  resultTextHebrew: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#1D3557',
  },
  russianPhraseText: { color: '#0B7285', textAlign: 'right' },
  translitAltText: { fontStyle: 'italic', color: '#B23A48', textAlign: 'right' },

  closeButton: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default SearchModal;
