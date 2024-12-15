const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require("groq-sdk");
const OpenAI = require("openai");
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment Variables:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Loaded (starts with: ' + process.env.GROQ_API_KEY.substring(0, 10) + '...)' : 'Not loaded');
console.log('XAI_API_KEY:', process.env.XAI_API_KEY ? 'Loaded (starts with: ' + process.env.XAI_API_KEY.substring(0, 10) + '...)' : 'Not loaded');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Loaded (starts with: ' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...)' : 'Not loaded');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded (starts with: ' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : 'Not loaded');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize AI clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1"  // Replace with actual X.AI base URL
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Validate API keys
const API_KEYS = {
  GROQ: process.env.GROQ_API_KEY,
  XAI: process.env.XAI_API_KEY,
  OPENROUTER: process.env.OPENROUTER_API_KEY,
  GEMINI: process.env.GEMINI_API_KEY
};

Object.entries(API_KEYS).forEach(([key, value]) => {
  if (!value) {
    console.error(`Warning: ${key}_API_KEY is not set`);
  } else {
    console.log(`${key}_API_KEY loaded successfully`);
  }
});

const AI_MODELS = [
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    description: 'High-performance language model powered by Groq',
    supportsImages: false
  },
  {
    id: 'xai-grok',
    name: 'Grok',
    description: 'Witty and knowledgeable AI powered by xAI',
    supportsImages: false
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini Flash 2.0',
    description: 'Advanced AI model by Google with image understanding',
    supportsImages: true
  },
  {
    id: 'learnlm',
    name: 'LearnLM Pro',
    description: 'Experimental model with advanced capabilities',
    supportsImages: true
  }
];

const MODEL_HANDLERS = {
  'llama-3.3-70b': {
    async handle(messages) {
      try {
        // Add system message if not present
        if (!messages.find(m => m.role === 'system')) {
          messages.unshift({
            role: 'system',
            content: 'You are a helpful AI assistant powered by Llama.'
          });
        }

        console.log('Sending request to Groq with messages:', messages);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer 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`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-specdec',
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096,
            top_p: 1,
            stream: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Groq API error:', errorData);
          throw new Error(JSON.stringify({ error: errorData }));
        }

        const data = await response.json();
        console.log('Received response from Groq:', data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Unexpected API response:', data);
          throw new Error(JSON.stringify({ error: 'Invalid response format from Groq API' }));
        }

        return data.choices[0].message.content;
      } catch (error) {
        console.error('Error in Groq handler:', error);
        throw new Error(JSON.stringify({ error: error.message || 'Failed to get response from Groq API' }));
      }
    }
  },
  'xai-grok': {
    async handle(messages) {
      try {
        // Debug log for API key
        console.log('Using XAI API key:', process.env.XAI_API_KEY ? 'Present' : 'Missing');

        const xai = new OpenAI({
          apiKey: process.env.XAI_API_KEY,
          baseURL: "https://api.x.ai/v1"
        });
        
        // Add system message if not present
        if (!messages.find(m => m.role === 'system')) {
          messages.unshift({
            role: 'system',
            content: 'You are Grok, a chatbot inspired by the Hitchhiker\'s Guide to the Galaxy.'
          });
        }

        console.log('Sending request to Grok with messages:', messages);
        
        const completion = await xai.chat.completions.create({
          model: "grok-beta",
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
          stream: false
        });

        console.log('Received response from Grok:', completion.choices[0]);
        return completion.choices[0].message.content;
      } catch (error) {
        console.error('Error in XAI handler:', error);
        throw new Error(JSON.stringify({ error: error.message || 'Failed to get response from XAI API' }));
      }
    }
  },
  'gemini-2.0-flash-exp': {
    async handle(messages, image) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        if (image) {
          // Handle image input if provided
          const imageData = await image.arrayBuffer();
          const prompt = messages[messages.length - 1].content;
          
          const result = await model.generateContent([prompt, {
            inlineData: {
              data: Buffer.from(imageData).toString('base64'),
              mimeType: image.mimetype
            }
          }]);
          
          return result.response.text();
        } else {
          // Text-only input
          const prompt = messages[messages.length - 1].content;
          const result = await model.generateContent(prompt);
          return result.response.text();
        }
      } catch (error) {
        console.error('Error in Gemini handler:', error);
        throw new Error(JSON.stringify({ error: error.message || 'Failed to get response from Gemini API' }));
      }
    }
  },
  'learnlm': {
    async handle(messages, image) {
      try {
        // Debug log for API key
        console.log('Using OpenRouter API key:', process.env.OPENROUTER_API_KEY);
        
        const lastMessage = messages[messages.length - 1];
        let content = [];

        // Add text content
        content.push({
          type: "text",
          text: lastMessage.content
        });

        // Add image if provided
        if (image) {
          const base64Image = Buffer.from(image.buffer).toString('base64');
          const imageUrl = `data:${image.mimetype};base64,${base64Image}`;
          content.push({
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          });
        }

        // Debug log for request
        const requestBody = {
          model: 'google/learnlm-1.5-pro-experimental:free',
          messages: [{
            role: 'user',
            content: content
          }],
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1
        };
        console.log('OpenRouter request:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Title': '4D GPT',
            'OR-SITE-URL': 'http://localhost:3000',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenRouter API error details:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            error: errorData
          });
          throw new Error(JSON.stringify({ error: errorData }));
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Unexpected API response:', data);
          throw new Error(JSON.stringify({ error: 'Invalid response format from OpenRouter API' }));
        }

        return data.choices[0].message.content;
      } catch (error) {
        console.error('Error in LearnLM handler:', error);
        throw new Error(JSON.stringify({ error: error.message || 'Failed to get response from LearnLM API' }));
      }
    }
  }
};

// In-memory store for chat history
const chatHistory = {};

// Endpoint to get available AI models
app.get('/api/models', (req, res) => {
  try {
    const models = [
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
        name: 'Gemini 2.0 flash',
        supportsImages: true
      },
      {
        id: 'learnlm',
        name: 'LearnLM Pro',
        supportsImages: true
      }
    ];
    res.json(models);
  } catch (error) {
    console.error('Error in /api/models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat endpoint
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const model = req.body.model || 'llama-3.3-70b';
    const image = req.file;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get chat history for the session
    const messages = chatHistory[sessionId] || [];
    messages.push({ role: 'user', content: message });

    try {
      let response;
      switch (model) {
        case 'llama-3.3-70b':
          if (image) {
            return res.status(400).json({ error: 'This model does not support images' });
          }
          response = await MODEL_HANDLERS[model].handle(messages);
          break;

        case 'xai-grok':
          if (image) {
            return res.status(400).json({ error: 'This model does not support images' });
          }
          response = await MODEL_HANDLERS[model].handle(messages);
          break;

        case 'gemini-2.0-flash-exp':
          response = await MODEL_HANDLERS[model].handle(messages, image);
          break;

        case 'learnlm':
          response = await MODEL_HANDLERS[model].handle(messages, image);
          break;

        default:
          return res.status(400).json({ error: 'Invalid model selected' });
      }

      // Add AI response to chat history
      messages.push({ role: 'assistant', content: response });
      chatHistory[sessionId] = messages;

      // Stream the response character by character
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      // Stream in larger chunks for faster response
      const chunkSize = 8; // Send 8 characters at a time
      const chars = response.split('');
      
      for (let i = 0; i < chars.length; i += chunkSize) {
        const chunk = chars.slice(i, i + chunkSize).join('');
        res.write(chunk);
        // Minimal delay to prevent overwhelming the client
        if (i % 32 === 0) { // Add tiny delay every 32 characters
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      res.end();

    } catch (error) {
      console.error(`Error with ${model}:`, error);
      res.status(500).json({ error: error.message || 'Failed to get response from AI model' });
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
