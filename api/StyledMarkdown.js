import React from 'react';
import Markdown from 'react-native-markdown-display';

const StyledMarkdown = ({ children }) => {
  return (
    <Markdown
      style={{
        body: { fontSize: 16, color: '#000' },
        strong: { fontWeight: 'bold', color: '#003366' },
        em: { fontStyle: 'italic', color: 'red' },
        table: {
          backgroundColor: '#f7f7f7',
          borderWidth: 1,
          borderColor: '#ccc',
        },
        th: {
          backgroundColor: '#ddd',
          fontWeight: 'bold',
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 4,
        },
        td: {
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 4,
        },
      }}
    >
      {children || ''}
    </Markdown>
  );
};

export default StyledMarkdown;