import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, IconButton, Snackbar, useTheme, Typography, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TypingEffect = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const intervalRef = useRef(null);
  const index = useRef(0);
  const charsPerTick = 50; // Very large chunks for fast typing

  useEffect(() => {
    index.current = 0;
    setDisplayText('');
    
    intervalRef.current = setInterval(() => {
      if (index.current < text.length) {
        const charsToAdd = text.slice(
          index.current,
          Math.min(index.current + charsPerTick, text.length)
        );
        setDisplayText(prev => prev + charsToAdd);
        index.current += charsPerTick;
      } else {
        clearInterval(intervalRef.current);
      }
    }, 1);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return <span>{displayText}</span>;
};

const ChatMessage = ({ message, isNew, markdownComponents, isThinking }) => {
  const [copied, setCopied] = useState(false);
  const theme = useTheme();
  const isAI = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom colors for chat bubbles
  const colors = {
    ai: {
      background: '#201A15',    // Darker brown for AI
      text: '#E6D5C5',         // Light beige text
      heading: '#C9A66B',      // Gold brown
      emphasis: '#B87F5F'      // Accent brown
    },
    user: {
      background: '#2D2419',    // Lighter brown for user
      text: '#E6D5C5',         // Light beige text
      heading: '#C9A66B',      // Gold brown
      emphasis: '#B87F5F'      // Accent brown
    }
  };

  const currentColors = isAI ? colors.ai : colors.user;

  // Custom markdown components with color-aware styling
  const coloredMarkdownComponents = {
    ...markdownComponents,
    h1: ({ children }) => (
      <h1 style={{ 
        color: currentColors.heading,
        fontSize: '1.8em',
        fontWeight: 'bold',
        marginTop: '0.5em',
        marginBottom: '0.5em'
      }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ 
        color: currentColors.heading,
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginTop: '0.5em',
        marginBottom: '0.5em'
      }}>{children}</h2>
    ),
    strong: ({ children }) => (
      <strong style={{ 
        color: currentColors.emphasis,
        fontSize: '1.1em',
        fontWeight: 'bold'
      }}>{children}</strong>
    ),
    p: ({ children }) => (
      <p style={{ 
        color: currentColors.text,
        margin: '0.5em 0'
      }}>{children}</p>
    ),
    li: ({ children }) => (
      <li style={{ 
        color: currentColors.text,
        margin: '0.25em 0'
      }}>{children}</li>
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Box sx={{ 
          position: 'relative',
          backgroundColor: '#1A1512',
          borderRadius: '12px',
          mb: 2,
          overflow: 'hidden',
          boxShadow: 'none',
          border: '1px solid rgba(184,127,95,0.1)'
        }}>
          <SyntaxHighlighter
            style={{
              ...oneDark,
              'pre[class*="language-"]': {
                ...oneDark['pre[class*="language-"]'],
                textShadow: 'none',
                background: '#1A1512',
                margin: 0,
                borderRadius: '12px'
              },
              'code[class*="language-"]': {
                ...oneDark['code[class*="language-"]'],
                textShadow: 'none',
                background: '#1A1512'
              }
            }}
            language={match[1].toLowerCase()}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1em',
              backgroundColor: '#1A1512',
              textShadow: 'none',
              boxShadow: 'none',
              border: 'none'
            }}
            codeTagProps={{
              style: {
                textShadow: 'none',
                backgroundColor: '#1A1512'
              }
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <code 
          className={className} 
          style={{ 
            textShadow: 'none',
            backgroundColor: '#1A1512',
            boxShadow: 'none'
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
  };

  // Render content based on message type and state
  const renderContent = () => {
    if (isThinking) return "ai is thinking...";
    
    if (isAI) {
      if (isNew) {
        return <TypingEffect text={message.content} />;
      }
      return <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={coloredMarkdownComponents}
      >
        {message.content}
      </ReactMarkdown>;
    }
    
    return <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={coloredMarkdownComponents}
    >
      {message.content}
    </ReactMarkdown>;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isAI ? 'flex-start' : 'flex-end',
        mb: 2,
        opacity: isNew ? 0.7 : 1,
        transition: 'opacity 0.5s ease-in-out',
        px: {
          xs: '5%',  // 5% padding on mobile
          sm: '10%', // 10% padding on tablet
          md: '15%'  // 15% padding on desktop
        }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor: currentColors.background,
          color: currentColors.text,
          borderRadius: '16px', // More rounded corners
          maxWidth: '85%',
          border: `1px solid rgba(184,127,95,${isAI ? '0.1' : '0.2'})`,
          '& pre': {
            margin: '0.5em 0',
            borderRadius: '12px',
            overflow: 'auto',
            maxWidth: '100%',
            backgroundColor: '#1A1512 !important',
            boxShadow: 'none !important',
            border: '1px solid rgba(184,127,95,0.1)',
            '& code': {
              textShadow: 'none !important',
              backgroundColor: '#1A1512 !important',
              boxShadow: 'none !important'
            }
          },
          '& code': {
            backgroundColor: '#1A1512',
            color: '#E6D5C5',
            padding: '0.2em 0.4em',
            borderRadius: '6px',
            fontSize: '0.9em',
            wordBreak: 'break-word',
            textShadow: 'none',
            boxShadow: 'none',
            border: '1px solid rgba(184,127,95,0.1)'
          },
          '& p': {
            margin: '0.5em 0',
            lineHeight: 1.6
          }
        }}
      >
        <Box sx={{ position: 'relative', mb: 2 }}>
          {renderContent()}
        </Box>
        
        {/* Copy button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: { xs: 1, sm: 2 },
            borderTop: '1px solid rgba(255,255,255,0.1)',
            pt: { xs: 0.5, sm: 1 }
          }}
        >
          <Button
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(message.content);
              setCopied(true);
            }}
            sx={{
              color: 'grey.400',
              textTransform: 'none',
              fontSize: {
                xs: '0.7rem',
                sm: '0.8rem'
              },
              py: { xs: 0.5, sm: 1 },
              '&:hover': {
                color: 'grey.200',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Copy message
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ChatMessage;
