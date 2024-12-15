import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function CodeBlock({ content, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: 'relative', mt: 1, mb: 1 }}>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        customStyle={{
          margin: 0,
          borderRadius: '4px',
          paddingBottom: '2.5em' // Space for copy button
        }}
      >
        {content}
      </SyntaxHighlighter>
      <Box sx={{ 
        position: 'absolute', 
        bottom: 8,
        right: 8,
        zIndex: 1
      }}>
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{ 
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            color: copied ? 'success.main' : 'text.secondary'
          }}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default CodeBlock;
