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

const SearchModalFr = ({ visible, onToggle, onSelectVerb }) => {
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

  const pickFrenchInf = useCallback((row) => {
    return (
      row?.french ||
      row?.verbFrench ||
      row?.frenchInfinitive ||
      row?.fr ||
      row?.frTextShort ||
      row?.frtext || // fallback
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
          frenchInfinitive: pickFrenchInf(row),
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
  }, [normalizeHebrew, pickFrenchInf, binyanByInfinitiveHebrew]);

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
      (v.french || '').toLowerCase().includes(q) ||
      (v.frtext || '').toLowerCase().includes(q) ||
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
          <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            Verbes de l’exercice
          </Text>

          <TextInput
            style={styles.input}
            // placeholder="Entrez un mot à rechercher (min. 3 caractères)"
            onChangeText={handleInputChange}
            value={searchQuery}
            onBlur={handleBlur}
            maxFontSizeMultiplier={1.2}
          />

          <TouchableOpacity
            style={[styles.button, !isSearchEnabled && styles.buttonDisabled]}
            onPress={handleSearchPress}
            disabled={!isSearchEnabled}
          >
            <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
              Rechercher
            </Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search results (only after search) */}
            {didSearch && (
              <>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
                  Résultats de recherche
                </Text>

                {searchResults.length === 0 ? (
                  <Text style={styles.emptyText} maxFontSizeMultiplier={1.2}>
                    Aucun résultat.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.hintText} maxFontSizeMultiplier={1.2}>
                      Appuyez sur un résultat pour ouvrir la conjugaison
                    </Text>

                    {searchResults.map((r, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.resultContainer}
                        onPress={() => handleSearchResultPress(r)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.resultTextBase, styles.infinitiveText]} maxFontSizeMultiplier={1.2}>
                          {r.infinitive}
                        </Text>

                        <Text style={[styles.resultTextBase, styles.frenchShortText]} maxFontSizeMultiplier={1.2}>
                          {r.french}
                        </Text>

                        <Text style={[styles.resultTextBase, styles.translitMainText]} maxFontSizeMultiplier={1.2}>
                          {r.transliteration}
                        </Text>

                        <Text style={[styles.resultTextBase, styles.resultTextHebrew]} maxFontSizeMultiplier={1.2}>
                          {r.hebrewtext}
                        </Text>

                        <Text style={[styles.resultTextBase, styles.frenchPhraseText]} maxFontSizeMultiplier={1.2}>
                          {r.frtext}
                        </Text>

                        <Text style={[styles.resultTextBase, styles.translitAltText]} maxFontSizeMultiplier={1.2}>
                          {r.translit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                <View style={styles.divider} />
              </>
            )}

            {/* Verbs list (table style) */}
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
              Choisissez un verbe à pratiquer
            </Text>

            {/* <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.colHebHeader]} maxFontSizeMultiplier={1.2}>
                Infinitif (hébreu)
              </Text>
              <Text style={[styles.tableCell, styles.colBinyanHeader]} maxFontSizeMultiplier={1.2}>
                Binyan
              </Text>
              <Text style={[styles.tableCell, styles.colFrHeader]} maxFontSizeMultiplier={1.2}>
                Français
              </Text>
            </View> */}

            {allVerbsList.map((item, idx) => (
              <TouchableOpacity
                key={`${item.infinitiveHebrew}_${idx}`}
                style={[styles.tableRow, getBinyanRowStyle(item.binyan)]}
                onPress={() => handleTableVerbPress(item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tableCell, styles.colHeb]} maxFontSizeMultiplier={1.2}>
                  {item.infinitiveHebrew}
                </Text>

                <Text style={[styles.tableCell, styles.colBinyan]} maxFontSizeMultiplier={1.2}>
                  {item.binyan}
                </Text>

                <Text style={[styles.tableCell, styles.colFr]} maxFontSizeMultiplier={1.2}>
                  {item.frenchInfinitive}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onToggle}>
            <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.2}>
              Fermer
            </Text>
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 0,
    backgroundColor: '#FFFDEF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '94%',
    maxHeight: '86%',
  },
  modalText: {
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
    color: '#2B3270',
  },

  input: {
    width: '100%',
    height: 40,
    borderColor: '#C3C3C3',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'center',
  },

  button: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: { backgroundColor: '#9CA9B5' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  resultsScroll: { width: '100%', flexGrow: 0 },
  resultsContent: { paddingBottom: 8 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B3270',
    textAlign: 'center',
    marginBottom: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#C3D1E0',
    marginVertical: 10,
    width: '100%',
  },

  /* ====== Search results ====== */
  hintText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B3270',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 6,
  },

  resultContainer: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C3D1E0',
    backgroundColor: '#E4ECF5',
    marginBottom: 6,
  },
  resultTextBase: {
    fontSize: 14,
    color: '#333',
    marginBottom: 1,
  },

  infinitiveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3F60',
  },
  frenchShortText: {
    fontWeight: '600',
    color: '#1C3F60',
  },
  translitMainText: {
    fontStyle: 'italic',
    color: '#FF5733',
  },

  resultTextHebrew: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  frenchPhraseText: {
    fontWeight: '500',
    color: '#0B7285',
    textAlign: 'right',
  },
  translitAltText: {
    fontStyle: 'italic',
    color: '#B23A48',
    textAlign: 'right',
  },

  /* ====== Table header + rows ====== */
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
  colBinyanHeader: {
    flex: 0.8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colFrHeader: {
    flex: 1.1,
    fontWeight: 'bold',
    textAlign: 'left',
  },

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
  colFr: {
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

  closeButton: {
    backgroundColor: '#1C3F60',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchModalFr;
