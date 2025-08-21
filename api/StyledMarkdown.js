import React from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { marked } from 'marked';

// Минимальные опции Markdown
marked.setOptions({ gfm: true, breaks: true });

// ЕДИНАЯ обёртка для слов на иврите (с никудом или без)
const wrapHebrewWords = (text) => {
  // Захватываем последовательности евр. букв и диакритик
  return text.replace(/([\u0591-\u05C7\u05D0-\u05EA]{2,})/g, '<span class="hebrew">$1</span>');
};

// (транслит) — перевод  → один неразрывный блок
const wrapTranslitAndTranslation = (text) => {
  return text.replace(
    /\(([a-zA-Z' ־\-]+)\)\s*—\s*([^\n]+)/g,
    '<span class="translitAndTranslation">($1) — $2</span>'
  );
};

// Только (транслит) → отдельный спан
const wrapTranslitOnly = (text) => {
  return text.replace(
    /\(([a-zA-Z' ־\-]+)\)/g,
    '<span class="translitOnly">($1)</span>'
  );
};

const StyledMarkdown = ({ children }) => {
  const { width } = useWindowDimensions();
  const markdown = typeof children === 'string' ? children.replace(/\\n/g, '\n') : '';

  if (typeof children !== 'string') {
    console.warn('❌ StyledMarkdown получил НЕ строку!', children);
  }

  // Никаких лишних преобразований — только наши 3 обёртки
  let processed = markdown;
  processed = wrapTranslitAndTranslation(processed);
  processed = wrapTranslitOnly(processed);
  processed = wrapHebrewWords(processed);

  const html = marked.parse(processed);

  // Только классы для иврита и транслита
  const classesStyles = {
    hebrew: {
      fontSize: 18,
      lineHeight: 28,
      color: '#003366',
      fontWeight: 'bold',
      textAlign: 'right',
    },
    translitAndTranslation: {
      fontStyle: 'italic',
      // color: '#b92828',
      fontSize: 16,
    },
    translitOnly: {
      fontStyle: 'italic',
      // color: '#c62828',
      fontSize: 16,
    },
  };

  return (
    <RenderHTML
      contentWidth={width}
      source={{ html }}
      classesStyles={classesStyles}
      baseStyle={{ color: '#000' }}
      defaultTextProps={{ selectable: true, maxFontSizeMultiplier: 1.2 }}
    />
  );
};

export default StyledMarkdown;
