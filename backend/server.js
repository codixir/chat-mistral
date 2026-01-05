const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Client connected');
  let abortController = null;

  socket.on('chat message', async (prompt) => {
    console.log('Received prompt:', prompt);
    
    // Create new AbortController for this request
    abortController = new AbortController();

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral:latest',
          prompt: `Please provide your response in markdown format. Use markdown syntax for:
- Headers (# for main headers, ## for subheaders, etc.)
- Code blocks (use triple backticks with language name)
- Lists (use - or numbers)
- Emphasis (* for italic, ** for bold)
- Links and images if needed

Here's the user's question:

${prompt}`
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line);
            if (data.response) {
              socket.emit('chat response', data.response);
            }
          }
        }
      }

      socket.emit('response complete');
    } catch (error) {
      console.error('Error:', error);
      if (error.name === 'AbortError') {
        socket.emit('response stopped');
      } else {
        socket.emit('error', 'Error communicating with model');
      }
    } finally {
      abortController = null;
    }
  });

  socket.on('stop response', () => {
    if (abortController) {
      abortController.abort();
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (abortController) {
      abortController.abort();
    }
  });
});

const PORT = 9000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
