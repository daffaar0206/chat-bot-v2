import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const savedCurrentId = localStorage.getItem('currentSessionId');
    return savedCurrentId || null;
  });

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('currentSessionId', currentSessionId);
    } else {
      localStorage.removeItem('currentSessionId');
    }
  }, [currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const addMessage = (message) => {
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? {
            ...session,
            messages: session.messages.map(m => 
              m.id === message.id 
                ? message 
                : m
            ).filter(m => m.id !== message.id).concat(message)
          }
        : session
    ));
  };

  const updateMessage = (messageId, content) => {
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? {
            ...session,
            messages: session.messages.map(m => 
              m.id === messageId 
                ? { ...m, content } 
                : m
            )
          }
        : session
    ));
  };

  const createSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: 'llama-3.3-70b' // Set Llama as default
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    return newSession;
  };

  const updateSessionTitle = (sessionId, title) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, title }
        : session
    ));
  };

  const generateSessionTitle = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.messages.length) return;

    const firstMessage = session.messages[0].content;
    // Generate a title from the first message (max 50 chars)
    const title = firstMessage.length > 50
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage;
    
    updateSessionTitle(sessionId, title);
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(session => session.id !== sessionId);
      setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const value = {
    sessions,
    currentSession,
    currentSessionId,
    createSession,
    deleteSession,
    setCurrentSessionId,
    addMessage,
    updateMessage,
    updateSessionTitle,
    generateSessionTitle
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
