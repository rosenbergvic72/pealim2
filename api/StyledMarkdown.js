import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { marked } from 'marked';

// Настройки marked — один раз
marked.setOptions({ gfm: true, breaks: true });

// --- helpers (как было) ---
const wrapHebrewWords = (text) =>
  text.replace(/([\u0591-\u05C7\u05D0-\u05EA]{2,})/g, '<span class="hebrew">$1</span>');

const wrapTranslitAndTranslation = (text) =>
  text.replace(/\(([a-zA-Z' ־\-]+)\)\s*—\s*([^\n]+)/g, '<span class="translitAndTranslation">($1) — $2</span>');

const wrapTranslitOnly = (text) =>
  text.replace(/\(([a-zA-Z' ־\-]+)\)/g, '<span class="translitOnly">($1)</span>');

// === МЕМо-версия ===
function StyledMarkdown({ children }) {
  const { width } = useWindowDimensions();

  const markdown = typeof children === 'string' ? children.replace(/\\n/g, '\n') : '';
  if (typeof children !== 'string') {
    console.warn('❌ StyledMarkdown получил НЕ строку!', children);
  }

  // heavy work → один раз на изменение входа
  const html = useMemo(() => {
    let processed = markdown;
    processed = wrapTranslitAndTranslation(processed);
    processed = wrapTranslitOnly(processed);
    processed = wrapHebrewWords(processed);
    return marked.parse(processed);
  }, [markdown]);

  // ВСЕ объекты пропсов — стабильные
  const source = useMemo(() => ({ html }), [html]);

  const classesStyles = useMemo(
    () => ({
      hebrew: {
        fontSize: 18,
        lineHeight: 28,
        color: '#003366',
        fontWeight: 'bold',
        textAlign: 'right',
      },
      translitAndTranslation: {
        fontStyle: 'italic',
        fontSize: 16,
      },
      translitOnly: {
        fontStyle: 'italic',
        fontSize: 16,
      },
    }),
    []
  );

  const baseStyle = useMemo(() => ({ color: '#000' }), []);
  const defaultTextProps = useMemo(
    () => ({ selectable: true, maxFontSizeMultiplier: 1.2 }),
    []
  );

  return (
    <RenderHTML
      contentWidth={width}
      source={source}
      classesStyles={classesStyles}
      baseStyle={baseStyle}
      defaultTextProps={defaultTextProps}
    />
  );
}

// Ререндерим только если меняется текст
export default React.memo(StyledMarkdown, (prev, next) => prev.children === next.children);
