import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageIcon from '@mui/icons-material/Image';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSession } from '../contexts/SessionContext';
import ChatMessage from './ChatMessage';
import InputAdornment from '@mui/material/InputAdornment';

function CodeBlock({ content, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      <IconButton
        onClick={handleCopy}
        size="small"
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        customStyle={{
          padding: '2em',
          borderRadius: '4px',
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

function Chat({ selectedModel }) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newMessageId, setNewMessageId] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const { currentSession, addMessage, generateSessionTitle } = useSession();

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setIsUserScrolling(!isAtBottom);
  };

  useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom();
    }
  }, [currentSession?.messages, isUserScrolling]);

  useEffect(() => {
    let scrollTimeout;
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const handleScroll = () => {
        setIsUserScrolling(true);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          setIsUserScrolling(!isNearBottom);
        }, 150);
      };

      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, []);

  // Custom markdown components
  const markdownComponents = {
    h1: ({ children }) => (
      <h1 style={{ 
        color: '#90caf9',
        fontSize: '1.8em',
        fontWeight: 'bold',
        marginTop: '0.5em',
        marginBottom: '0.5em'
      }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ 
        color: '#90caf9',
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginTop: '0.5em',
        marginBottom: '0.5em'
      }}>{children}</h2>
    ),
    strong: ({ children }) => (
      <strong style={{ 
        color: '#f48fb1',
        fontSize: '1.1em',
        fontWeight: 'bold'
      }}>{children}</strong>
    ),
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setInput('');
    setIsProcessing(true);
    addMessage(userMessage);
    scrollToBottom();

    let aiMessage;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          model: selectedModel,
          sessionId: currentSession?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Create a new message for streaming
      aiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      addMessage(aiMessage);
      setNewMessageId(aiMessage.id);

      // Read the stream
      const reader = response.body.getReader();
      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        accumulatedContent += chunk;
        
        addMessage({
          ...aiMessage,
          content: accumulatedContent
        });

        // Auto scroll only if user is at bottom
        if (!isUserScrolling) {
          scrollToBottom();
        }
      }
      
      // Mark message as complete
      addMessage({
        ...aiMessage,
        content: accumulatedContent
      });
      
    } catch (error) {
      console.error('Error:', error);
      addMessage({
        ...aiMessage,
        content: `Error: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      if (currentSession?.messages.length === 0) {
        generateSessionTitle(currentSession.id);
      }
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: { xs: 1, sm: 2 },
          maxWidth: '100%',
          margin: '0 auto',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '8px' }
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255,255,255,0.2)'
          }
        }}
        onScroll={handleScroll}
      >
        {currentSession?.messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isNew={isProcessing && index === currentSession.messages.length - 1}
            markdownComponents={markdownComponents}
          />
        ))}
        <div ref={messagesEndRef} style={{ height: '20px' }} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 1, sm: 2 },
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <TextField
          multiline
          maxRows={4}
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={isProcessing}
          sx={{
            '& .MuiInputBase-root': {
              p: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  type="submit" 
                  disabled={isProcessing || !input.trim()}
                  sx={{ 
                    p: { xs: 0.5, sm: 1 },
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1.2rem', sm: '1.5rem' }
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Box>
  );
}

export default Chat;
