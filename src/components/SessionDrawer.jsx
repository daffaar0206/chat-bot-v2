import React, { useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSession } from '../contexts/SessionContext';

const drawerWidth = 240;

const DEFAULT_MODELS = [
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    supportsImages: false
  },
  {
    id: 'xai-grok',
    name: 'Grok',
    supportsImages: false
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    supportsImages: true
  },
  {
    id: 'learnlm',
    name: 'LearnLM Pro',
    supportsImages: true
  }
];

function SessionDrawer({ selectedModel, setSelectedModel }) {
  const { sessions, currentSession, createSession, deleteSession, setCurrentSessionId } = useSession();

  // Set Llama as default model when component mounts
  useEffect(() => {
    if (!selectedModel) {
      setSelectedModel('llama-3.3-70b');
    }
  }, []);

  const generateSessionTitle = (messages) => {
    if (!messages || messages.length === 0) return 'New Chat';
    
    // Find first user message
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    // Extract first line or first few words
    const content = firstUserMessage.content;
    const firstLine = content.split('\n')[0];
    
    // Limit to first 30 characters or first 5 words
    const words = firstLine.split(' ');
    if (words.length <= 5) {
      return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
    }
    return words.slice(0, 5).join(' ') + '...';
  };

  const SessionItem = ({ session }) => {
    const { currentSessionId, setCurrentSessionId, deleteSession } = useSession();
    const isActive = session.id === currentSessionId;
    const title = generateSessionTitle(session.messages);
    
    return (
      <ListItem 
        button 
        selected={isActive}
        onClick={() => setCurrentSessionId(session.id)}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          }
        }}
      >
        <ListItemText 
          primary={title} 
          primaryTypographyProps={{
            noWrap: true,
            style: { maxWidth: '200px' }
          }}
        />
        <IconButton 
          edge="end" 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            deleteSession(session.id);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.default',
          borderRight: '1px solid',
          borderColor: 'divider'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" align="center" gutterBottom>
          4D GPT
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>AI Model</InputLabel>
          <Select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            label="AI Model"
          >
            {DEFAULT_MODELS.map(model => (
              <MenuItem key={model.id} value={model.id}>
                {model.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createSession}
          sx={{ mb: 2 }}
        >
          New Chat
        </Button>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {sessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </List>
    </Drawer>
  );
}

export default SessionDrawer;
