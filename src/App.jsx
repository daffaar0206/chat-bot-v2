import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import Chat from './components/Chat';
import SessionDrawer from './components/SessionDrawer';
import { SessionProvider } from './contexts/SessionContext';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1A202C',
      paper: '#2D3748',
    },
    primary: {
      main: '#3182CE',
      light: '#90CDF4',
      dark: '#2C5282',
    },
    secondary: {
      main: '#F687B3',
      light: '#FED7E2',
      dark: '#D53F8C',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          overflow: 'hidden',
          height: '100vh',
          '& #root': {
            height: '100vh',
          },
        },
      },
    },
  },
});

function App() {
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b'); 
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SessionProvider>
        <Box sx={{ 
          display: 'flex', 
          height: '100vh',
          overflow: 'hidden'
        }}>
          {/* Session drawer - hide on mobile, show button to toggle */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              width: 280,
              flexShrink: 0
            }}
          >
            <SessionDrawer 
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </Box>

          {/* Mobile menu button */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'fixed',
              top: 8,
              left: 8,
              zIndex: 1100
            }}
          >
            <IconButton
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ color: 'grey.300' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{
              keepMounted: true // Better mobile performance
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                width: 280,
                backgroundColor: 'background.default'
              }
            }}
          >
            <SessionDrawer 
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onClose={() => setMobileOpen(false)} 
            />
          </Drawer>

          {/* Main chat area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'hidden',
              position: 'relative',
              pt: { xs: '48px', md: 0 } // Add top padding on mobile for menu button
            }}
          >
            <Chat selectedModel={selectedModel} />
          </Box>
        </Box>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
