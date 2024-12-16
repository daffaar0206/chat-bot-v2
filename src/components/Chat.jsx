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
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

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
  const formRef = useRef(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newMessageId, setNewMessageId] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const { currentSession, addMessage, generateSessionTitle } = useSession();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      console.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent form submission/page reload
      handleSubmit(e);
    }
  };

  const handleSubmit = async () => {
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

    let aiMessage = null;
    try {
      setIsThinking(true); // Set isThinking to true before fetch
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
      setStreamingMessageId(aiMessage.id);
      addMessage(aiMessage);

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
      if (aiMessage) {
        addMessage({
          ...aiMessage,
          content: `Error: ${error.message}`
        });
      } else {
        console.error('aiMessage is undefined in catch block', error);
      }
    } finally {
      setStreamingMessageId(null);
      setIsProcessing(false);
      setIsThinking(false); // Set isThinking to false after response
      if (currentSession?.messages.length === 0) {
        generateSessionTitle(currentSession.id);
      }
    }
  };

  const styles = {
    root: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#1A1512',
    },
    sidebar: {
      width: 280,
      flexShrink: 0,
      backgroundColor: '#201A15',
      borderRight: '1px solid rgba(184,127,95,0.1)',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid rgba(184,127,95,0.1)',
    },
    modelSelect: {
      backgroundColor: '#2D2419',
      color: '#E6D5C5',
      border: '1px solid rgba(184,127,95,0.2)',
      borderRadius: '8px',
      '&:hover': {
        backgroundColor: '#362C1F'
      }
    },
    newChatButton: {
      backgroundColor: '#B87F5F',
      color: '#1A1512',
      margin: '20px',
      '&:hover': {
        backgroundColor: '#A06A4C'
      }
    },
    chatList: {
      flex: 1,
      overflow: 'auto',
      padding: '10px',
      '& .MuiListItem-root': {
        borderRadius: '8px',
        marginBottom: '4px',
        color: '#E6D5C5',
        '&:hover': {
          backgroundColor: '#2D2419'
        }
      }
    }
  };

  return (
    <Box sx={styles.root}>
      <Box sx={styles.sidebar}>
        {/* Sidebar content */}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            pt: 2,
            pb: 10,
            backgroundColor: '#1A1512', // Dark brown background
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#201A15',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#B87F5F',
              borderRadius: '4px',
            },
          }}
          onScroll={handleScroll}
        >
          {currentSession?.messages.map((message, index) => (
            <ChatMessage
              key={message.id || index}
              message={message}
              isNew={message.id === streamingMessageId}
              isThinking={isThinking && index === currentSession.messages.length - 1 && message.role === 'assistant'}
              markdownComponents={markdownComponents}
            />
          ))}
          <div ref={messagesEndRef} style={{ height: '20px' }} />
        </Box>

        <Box
          component="div"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 1, sm: 2 },
            backgroundColor: '#201A15', // Slightly darker brown
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(184,127,95,0.2)'
          }}
        >
          <Box
            sx={{
              maxWidth: '800px',
              margin: '0 auto',
              position: 'relative',
              width: '100%',
              px: { xs: 1, sm: 2 }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#2D2419', // Medium brown
                borderRadius: '16px', // More rounded corners
                padding: { xs: '8px 12px', sm: '10px 15px' },
                gap: '10px',
                border: '1px solid rgba(184,127,95,0.2)'
              }}
            >
              <IconButton 
                size="small" 
                onClick={toggleListening}
                sx={{ 
                  color: isListening ? '#B87F5F' : 'rgba(255,255,255,0.6)',
                  '&:hover': {
                    color: isListening ? '#B87F5F' : 'rgba(255,255,255,0.8)'
                  }
                }}
              >
                {isListening ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
              
              <TextField
                fullWidth
                variant="standard"
                placeholder="Message ChatGPT"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                InputProps={{
                  disableUnderline: true,
                  style: { 
                    color: '#fff',
                    fontSize: '16px',
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    padding: '4px 8px',
                    fontSize: { xs: '14px', sm: '16px' }
                  }
                }}
              />
              
              <IconButton 
                size="small"
                disabled={!input.trim()}
                onClick={handleSubmit}
                sx={{ 
                  color: input.trim() ? '#B87F5F' : 'rgba(255,255,255,0.4)',
                  backgroundColor: input.trim() ? 'rgba(184,127,95,0.1)' : 'transparent',
                  borderRadius: '8px',
                  padding: { xs: '6px', sm: '8px' },
                  '&:hover': {
                    backgroundColor: input.trim() ? 'rgba(184,127,95,0.2)' : 'transparent'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat;
