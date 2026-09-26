import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TEXTS = {
  ru: {
    title: 'УПРАВЛЕНИЕ РОТАЦИЕЙ',
    pinned: 'ЗАКРЕПЛЁННЫЕ',
    excluded: 'ИСКЛЮЧЁННЫЕ',
    empty: 'Список пуст',
    unpin: 'СНЯТЬ',
    restore: 'ВЕРНУТЬ',
    close: 'ЗАКРЫТЬ',
  },
  en: {
    title: 'ROTATION MANAGEMENT',
    pinned: 'PINNED',
    excluded: 'EXCLUDED',
    empty: 'The list is empty',
    unpin: 'UNPIN',
    restore: 'RESTORE',
    close: 'CLOSE',
  },
  fr: {
    title: 'GESTION DE LA ROTATION',
    pinned: 'ÉPINGLÉS',
    excluded: 'EXCLUS',
    empty: 'La liste est vide',
    unpin: 'RETIRER',
    restore: 'RÉTABLIR',
    close: 'FERMER',
  },
  es: {
    title: 'GESTIÓN DE ROTACIÓN',
    pinned: 'FIJADOS',
    excluded: 'EXCLUIDOS',
    empty: 'La lista está vacía',
    unpin: 'QUITAR',
    restore: 'RESTAURAR',
    close: 'CERRAR',
  },
  pt: {
    title: 'GESTÃO DA ROTAÇÃO',
    pinned: 'FIXADOS',
    excluded: 'EXCLUÍDOS',
    empty: 'A lista está vazia',
    unpin: 'REMOVER',
    restore: 'REPOR',
    close: 'FECHAR',
  },
  ar: {
    title: 'إدارة التكرار',
    pinned: 'مثبتة',
    excluded: 'مستبعدة',
    empty: 'القائمة فارغة',
    unpin: 'إلغاء التثبيت',
    restore: 'استعادة',
    close: 'إغلاق',
  },
  am: {
    title: 'የማዞሪያ አስተዳደር',
    pinned: 'የተሰኩ',
    excluded: 'የተወገዱ',
    empty: 'ዝርዝሩ ባዶ ነው',
    unpin: 'አስወግድ',
    restore: 'መልስ',
    close: 'ዝጋ',
  },
};

const LANGUAGE_ALIASES = {
  russian: 'ru',
  русский: 'ru',
  english: 'en',
  french: 'fr',
  français: 'fr',
  francais: 'fr',
  spanish: 'es',
  español: 'es',
  espanol: 'es',
  portuguese: 'pt',
  português: 'pt',
  portugues: 'pt',
  arabic: 'ar',
  arab: 'ar',
  العربية: 'ar',
  amharic: 'am',
  አማርኛ: 'am',
};

export const normalizeRootLanguage = language => {
  const value = String(language || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

  const resolved = LANGUAGE_ALIASES[value] || value.split('-')[0];

  return Object.prototype.hasOwnProperty.call(TEXTS, resolved)
    ? resolved
    : 'en';
};

const clean = value => String(value ?? '').trim();

// id в исходной базе остаётся идентификатором семейства.
// Этот ключ используется только для отдельного глагола.
export const getRootVerbKey = item => {
  if (
    !item ||
    !clean(item.id) ||
    !clean(item.verb) ||
    !clean(item.bin)
  ) {
    return '';
  }

  return JSON.stringify([
    clean(item.id),
    clean(item.verb),
    clean(item.bin),
  ]);
};

const EMPTY = [];

const RootVerbRotationModal = ({
  visible,
  language = 'en',
  items = EMPTY,
  excludedIds = EMPTY,
  pinnedIds = EMPTY,
  onRestore,
  onUnpin,
  onClose,
}) => {
  const lang = normalizeRootLanguage(language);
  const text = TEXTS[lang];
  const isRtl = lang === 'ar';

  const itemMap = useMemo(() => {
    const map = new Map();

    if (!Array.isArray(items)) return map;

    items.forEach(item => {
      const key = getRootVerbKey(item);
      if (key) map.set(key, item);
    });

    return map;
  }, [items]);

  const resolveItems = ids => {
    if (!Array.isArray(ids)) return [];

    return [...new Set(ids.map(String))]
      .map(key => {
        const item = itemMap.get(key);
        return item ? { key, item } : null;
      })
      .filter(Boolean);
  };

  const pinnedItems = resolveItems(pinnedIds);
  const excludedItems = resolveItems(excludedIds);

  const renderRow = ({ key, item }, actionLabel, onAction) => {
    const translation = clean(item[lang]) || clean(item.en);

    return (
      <View key={key} style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.hebrew} maxFontSizeMultiplier={1.15}>
            {item.verb}
          </Text>

          {!!translation && (
            <Text
              style={[styles.translation, isRtl && styles.rtl]}
              maxFontSizeMultiplier={1.15}
            >
              {translation}
            </Text>
          )}

          {!!item.transliteration && (
            <Text
              style={styles.transliteration}
              maxFontSizeMultiplier={1.15}
            >
              {item.transliteration}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.binyan} maxFontSizeMultiplier={1.1}>
              {item.bin}
            </Text>

            {!!item.root && (
              <Text style={styles.root} maxFontSizeMultiplier={1.1}>
                {item.root}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${item.verb}, ${item.bin}`}
          style={[
            styles.actionButton,
            !onAction && styles.disabled,
          ]}
          disabled={!onAction}
          activeOpacity={0.75}
          onPress={() => onAction?.(key)}
        >
          <Text style={styles.actionText} maxFontSizeMultiplier={1.1}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal} accessibilityViewIsModal>
          <Text style={styles.title} maxFontSizeMultiplier={1.15}>
            {text.title}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.sectionTitle, isRtl && styles.rtl]}>
              {text.pinned} ({pinnedItems.length})
            </Text>

            {pinnedItems.length ? (
              pinnedItems.map(entry =>
                renderRow(entry, text.unpin, onUnpin)
              )
            ) : (
              <Text style={styles.empty}>{text.empty}</Text>
            )}

            <Text style={[styles.sectionTitle, isRtl && styles.rtl]}>
              {text.excluded} ({excludedItems.length})
            </Text>

            {excludedItems.length ? (
              excludedItems.map(entry =>
                renderRow(entry, text.restore, onRestore)
              )
            ) : (
              <Text style={styles.empty}>{text.empty}</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.closeButton}
            activeOpacity={0.75}
            onPress={onClose}
          >
            <Text style={styles.closeText}>{text.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modal: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '82%',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFDEF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    marginBottom: 10,
    color: '#2D4769',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { paddingBottom: 8 },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 7,
    color: '#A84F70',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  empty: {
    paddingVertical: 14,
    color: '#8A8FA2',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D5DDEA',
    borderRadius: 14,
    backgroundColor: '#F7F9FC',
  },
  textBlock: { flex: 1, minWidth: 0 },
  hebrew: {
    color: '#333652',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: {
    marginTop: 3,
    color: '#666C82',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  transliteration: {
    marginTop: 3,
    color: '#6B708A',
    fontSize: 12,
    lineHeight: 18,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 5,
  },
  binyan: {
    color: '#A84F70',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '900',
    writingDirection: 'ltr',
  },
  root: {
    color: '#2D4769',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  actionButton: {
    width: 82,
    minHeight: 44,
    paddingHorizontal: 7,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#2D4769',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabled: { opacity: 0.4 },
  closeButton: {
    width: '52%',
    minHeight: 48,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: '#CE6857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default RootVerbRotationModal;