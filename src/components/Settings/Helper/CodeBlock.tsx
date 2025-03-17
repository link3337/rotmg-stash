import { useAppSelector } from '@/hooks/redux';
import { selectTheme } from '@/store/slices/SettingsSlice';
import React from 'react';
import { Prism, SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { a11yDark, a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const SyntaxHighlighter = Prism as any as React.FC<SyntaxHighlighterProps>;

interface CodeBlockProps {
  children?: null;
  language?: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const theme = useAppSelector(selectTheme);

  return (
    <SyntaxHighlighter
      showLineNumbers
      startingLineNumber={1}
      language={language || 'powershell'}
      style={theme === 'dark' ? a11yDark : a11yLight}
      customStyle={{
        margin: 0,
        borderRadius: '6px'
      }}
    >
      {value}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
