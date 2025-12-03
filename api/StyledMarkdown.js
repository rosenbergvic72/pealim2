import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

// --- helpers ---
// оборачиваем иврит + даём явный RTL через спецсимволы
const wrapHebrewWords = (text) =>
  text.replace(
    /([\u0591-\u05C7\u05D0-\u05EA]{2,})/g,
    '<span class="hebrew">&#x200F;$1&#x200F;</span>'
  );

const wrapTranslitAndTranslation = (text) =>
  text.replace(
    /\(([a-zA-Z' ־\-]+)\)\s*—\s*([^\n]+)/g,
    '<span class="translitAndTranslation">($1) — $2</span>'
  );

const wrapTranslitOnly = (text) =>
  text.replace(
    /\(([a-zA-Z' ־\-]+)\)/g,
    '<span class="translitOnly">($1)</span>'
  );

// убираем синтаксис списков
const stripMarkdownLists = (text) =>
  text
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[\.\)]\s*/gm, '');

const stripHtmlLists = (html) =>
  html
    .replace(/<\/?(ul|ol)>/g, '')
    .replace(/<li>/g, '')
    .replace(/<\/li>/g, '<br/>');

function StyledMarkdown({ children }) {
  const { width } = useWindowDimensions();

  const markdown =
    typeof children === 'string' ? children.replace(/\\n/g, '\n') : '';
  if (typeof children !== 'string') {
    console.warn('❌ StyledMarkdown получил НЕ строку!', children);
  }

  const html = useMemo(() => {
    let processed = markdown;

    processed = stripMarkdownLists(processed);
    processed = wrapTranslitAndTranslation(processed);
    processed = wrapTranslitOnly(processed);
    processed = wrapHebrewWords(processed);

    let htmlRaw = marked.parse(processed);
    htmlRaw = stripHtmlLists(htmlRaw);

    return htmlRaw;
  }, [markdown]);

  const source = useMemo(() => ({ html }), [html]);

  // 🔹 стили span-классов — без lineHeight, чтобы не ломать строки
  const classesStyles = useMemo(
    () => ({
      hebrew: {
        fontSize: 18,
        color: '#003366',
        fontWeight: 'bold',
        writingDirection: 'rtl',
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

  // 🔹 единый lineHeight и отступы только на уровне тегов
  const tagsStyles = useMemo(
    () => ({
      p: {
        marginTop: 4,
        marginBottom: 8,
        lineHeight: 24,
        writingDirection: 'ltr',
      },
      h1: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
        lineHeight: 26,
      },
      h2: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
        lineHeight: 24,
      },
      h3: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 6,
        lineHeight: 22,
      },
      br: {
        marginBottom: 2,
      },
    }),
    []
  );

  const baseStyle = useMemo(
    () => ({
      color: '#000',
      fontSize: 16,
      lineHeight: 24,
      writingDirection: 'ltr',
    }),
    []
  );

  const defaultTextProps = useMemo(
    () => ({
      selectable: true,
      maxFontSizeMultiplier: 1.2,
      includeFontPadding: false, // чуть ровнее на Android
    }),
    []
  );

  return (
    <RenderHTML
      contentWidth={width}
      source={source}
      classesStyles={classesStyles}
      tagsStyles={tagsStyles}
      baseStyle={baseStyle}
      defaultTextProps={defaultTextProps}
    />
  );
}

export default React.memo(
  StyledMarkdown,
  (prev, next) => prev.children === next.children
);
