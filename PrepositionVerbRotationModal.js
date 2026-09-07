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
  he: {
    title: 'ניהול סבב',
    pinned: 'מוצמדים',
    excluded: 'מוסתרים',
    empty: 'הרשימה ריקה',
    unpin: 'בטל הצמדה',
    restore: 'החזר',
    close: 'סגור',
  },
};

const PrepositionVerbRotationModal = ({
  visible,
  language,
  items = [],
  excludedIds = [],
  pinnedIds = [],
  onRestore,
  onUnpin,
  onClose,
}) => {
  const text = TEXTS[language] || TEXTS.en;

  const itemMap = useMemo(() => {
    const map = new Map();
    items.forEach(item => map.set(String(item.id), item));
    return map;
  }, [items]);

  const pinnedItems = pinnedIds
    .map(id => itemMap.get(String(id)))
    .filter(Boolean);

  const excludedItems = excludedIds
    .map(id => itemMap.get(String(id)))
    .filter(Boolean);

  const renderRow = (item, actionLabel, onAction) => (
    <View key={item.id} style={styles.row}>
      <View style={styles.textBlock}>
        <Text
          style={styles.hebrew}
          numberOfLines={2}
          maxFontSizeMultiplier={1.1}
        >
          {item.hebrewFull}
        </Text>

        <Text
          style={styles.translation}
          numberOfLines={2}
          maxFontSizeMultiplier={1.1}
        >
          {item.translation}
        </Text>

        <Text style={styles.meta} maxFontSizeMultiplier={1.1}>
          {item.verb}
          {item.correct ? ` • ${item.correct}` : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.75}
        onPress={() => onAction?.(item.id)}
      >
        <Text style={styles.actionText} maxFontSizeMultiplier={1.1}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title} maxFontSizeMultiplier={1.15}>
            {text.title}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Text style={styles.sectionTitle}>
              {text.pinned} ({pinnedItems.length})
            </Text>

            {pinnedItems.length ? (
              pinnedItems.map(item =>
                renderRow(item, text.unpin, onUnpin)
              )
            ) : (
              <Text style={styles.empty}>{text.empty}</Text>
            )}

            <Text style={styles.sectionTitle}>
              {text.excluded} ({excludedItems.length})
            </Text>

            {excludedItems.length ? (
              excludedItems.map(item =>
                renderRow(item, text.restore, onRestore)
              )
            ) : (
              <Text style={styles.empty}>{text.empty}</Text>
            )}
          </ScrollView>

          <TouchableOpacity
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
  scroll: { flexGrow: 0 },
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
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: {
    marginTop: 2,
    color: '#666C82',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  meta: {
    marginTop: 2,
    color: '#A84F70',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  actionButton: {
    minWidth: 76,
    minHeight: 38,
    paddingHorizontal: 8,
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

export default PrepositionVerbRotationModal;