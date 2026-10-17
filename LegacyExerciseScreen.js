import React from 'react';

const normalizeLanguage = value => {
  const raw = String(value || 'ru').trim().toLowerCase();
  const aliases = {
    russian: 'ru', rus: 'ru', 'ru-ru': 'ru',
    english: 'en', eng: 'en', 'en-us': 'en', 'en-gb': 'en',
    french: 'fr', fra: 'fr', 'fr-fr': 'fr',
    spanish: 'es', spa: 'es', 'es-es': 'es',
    portuguese: 'pt', por: 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',
    arabic: 'ar', arab: 'ar', ara: 'ar', 'ar-il': 'ar',
    amharic: 'am', amh: 'am', 'am-et': 'am',
  };
  return aliases[raw] || raw;
};

export const createLegacyExerciseScreen = loaders => {
  const cache = {};

  return function LegacyExerciseScreen(props) {
    const language = normalizeLanguage(props?.route?.params?.language);
    const key = loaders[language] ? language : 'ru';

    if (!cache[key]) {
      const module = loaders[key]();
      cache[key] = module?.default || module;
    }

    const Component = cache[key];
    return <Component {...props} />;
  };
};
