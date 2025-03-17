import { useAppSelector } from '@/hooks/redux';
import { selectTheme } from '@/store/slices/SettingsSlice';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark, a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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
