import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, IconButton, Snackbar, useTheme, Typography, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const TypingEffect = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const intervalRef = useRef(null);
  const index = useRef(0);

  useEffect(() => {
    index.current = 0;
    setDisplayText('');
    
    intervalRef.current = setInterval(() => {
      if (index.current < text.length) {
        setDisplayText(prev => prev + text[index.current]);
        index.current++;
      } else {
        clearInterval(intervalRef.current);
      }
    }, 20);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return <span>{displayText}</span>;
};

const ChatMessage = ({ message, isNew, markdownComponents }) => {
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
      background: '#2D3748',  // Dark blue-grey
      text: '#E2E8F0',       // Light grey
      heading: '#90CDF4',    // Light blue
      emphasis: '#F687B3'    // Pink
    },
    user: {
      background: '#3182CE',  // Blue
      text: '#FFFFFF',       // White
      heading: '#BEE3F8',    // Lighter blue
      emphasis: '#FED7E2'    // Light pink
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
    )
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
        elevation={2}
        sx={{
          p: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
          maxWidth: {
            xs: '85%', // Wider on mobile
            sm: '80%', // Slightly narrower on tablet
            md: '70%'  // Standard width on desktop
          },
          backgroundColor: currentColors.background,
          color: currentColors.text,
          borderRadius: 2,
          position: 'relative',
          '& pre': {
            margin: '0.5em 0',
            borderRadius: 1,
            overflow: 'auto',
            maxWidth: '100%',
            fontSize: {
              xs: '12px', // Smaller font on mobile
              sm: '13px', // Medium font on tablet
              md: '14px'  // Standard font on desktop
            }
          },
          '& code': {
            backgroundColor: isAI ? '#1A202C' : '#2C5282',
            color: currentColors.text,
            padding: '0.2em 0.4em',
            borderRadius: '0.2em',
            fontSize: '0.9em',
            wordBreak: 'break-word'
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto'
          },
          '& p': {
            margin: { xs: '0.5em 0', sm: '0.75em 0' },
            fontSize: {
              xs: '0.9rem',
              sm: '1rem'
            },
            lineHeight: '1.5'
          }
        }}
      >
        <Box sx={{ position: 'relative', mb: 2 }}>
          {isAI && isNew ? (
            <Typography variant="body1">
              <TypingEffect text={message.content} />
            </Typography>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ...coloredMarkdownComponents,
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <Box sx={{ 
                      position: 'relative',
                      backgroundColor: '#1e1e1e',
                      borderRadius: '4px',
                      mb: 2,
                      overflow: 'hidden'
                    }}>
                      {/* Language label */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        padding: '4px 8px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderBottomRightRadius: '4px',
                        userSelect: 'none'
                      }}>
                        {match[1].toLowerCase()}
                      </Box>
                      
                      {/* Copy button */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderBottomLeftRadius: '4px',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.2)'
                        }
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                        setCopied(true);
                      }}>
                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                        <span style={{ paddingRight: '4px' }}>Copy code</span>
                      </Box>

                      <Box sx={{
                        '& pre': {
                          backgroundColor: '#1e1e1e !important',
                          margin: '0 !important',
                          padding: '32px 16px 16px !important'
                        },
                        '& code': {
                          fontFamily: '"Consolas", "Monaco", monospace !important',
                          fontSize: '14px !important',
                          lineHeight: '1.5 !important',
                          backgroundColor: 'transparent !important'
                        },
                        // VS Code-like syntax highlighting colors
                        '& .hljs-keyword': { color: '#C586C0 !important' },
                        '& .hljs-built_in': { color: '#4EC9B0 !important' },
                        '& .hljs-string': { color: '#CE9178 !important' },
                        '& .hljs-number': { color: '#B5CEA8 !important' },
                        '& .hljs-comment': { color: '#6A9955 !important' },
                        '& .hljs-function': { color: '#DCDCAA !important' },
                        '& .hljs-class': { color: '#4EC9B0 !important' },
                        '& .hljs-variable': { color: '#9CDCFE !important' },
                        '& .hljs-operator': { color: '#D4D4D4 !important' },
                        '& .hljs-punctuation': { color: '#D4D4D4 !important' }
                      }}>
                        <SyntaxHighlighter
                          language={match[1]}
                          style={atomOneDark}
                          customStyle={{
                            margin: 0,
                            padding: '32px 16px 16px',
                            background: '#1e1e1e',
                            borderRadius: '4px'
                          }}
                          useInlineStyles={true}
                          PreTag="pre"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </Box>
                    </Box>
                  ) : (
                    <code 
                      className={className} 
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                        fontFamily: '"Consolas", "Monaco", monospace'
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </Box>
        
        {/* Copy button at bottom */}
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
