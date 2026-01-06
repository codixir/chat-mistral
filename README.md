# chat-mistral

Chat Mistral is a small full-stack playground for chatting with a local Mistral/Ollama model. A Node/Express backend streams responses from the model over Socket.IO, and a React frontend renders the markdown output with code highlighting and copy helpers.

## Architecture
- **Backend (`backend/`)** – Express + Socket.IO server that relays prompts to `http://localhost:11434/api/generate`, streams incremental responses back to the browser, and exposes stop/cancel events.
- **Frontend (`mistral-chat-frontend/`)** – Create React App client that renders both sides of the conversation, supports markdown (via `react-markdown`) and syntax-highlighted code blocks, and provides copy buttons for the entire reply or specific code snippets.

```
Frontend (React) ⇄ Socket.IO ⇄ Backend (Express) ⇄ Local Mistral/Ollama server
```

## Prerequisites
- Node.js **18+** (the backend relies on the built-in `fetch`).
- npm 9+ (or any compatible package manager).
- A running local Mistral/Ollama instance that exposes the `POST /api/generate` endpoint on `localhost:11434`.

## Local setup
1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```
2. **Install frontend dependencies**
   ```bash
   cd ../mistral-chat-frontend
   npm install
   ```

## Running the apps
- **Backend (port 9000)**
  ```bash
  cd backend
  # Development (auto reload via nodemon)
  npm start
  # Or run once in production mode
  node server.js
  ```
- **Frontend (default CRA dev server on port 3000)**
  ```bash
  cd mistral-chat-frontend
  npm start
  ```
  The frontend connects to `http://localhost:9000` via Socket.IO and begins streaming the assistant’s response as soon as it arrives.

## Configuration & environment
- The backend currently hardcodes the Ollama endpoint to `http://localhost:11434/api/generate`. If your model server lives elsewhere, update `backend/server.js` or introduce environment variables before deployment.
- `.gitignore` excludes `node_modules/`, build artifacts, and any `*.env` files so API keys and other secrets never land in Git. Keep credentials in local environment files or a secrets manager.

## Available scripts
| Location | Script | Purpose |
| --- | --- | --- |
| `backend` | `npm start` | Runs the Express server with nodemon for hot reloads. |
| `backend` | `node server.js` | Starts the server without nodemon (use in production/PM2). |
| `mistral-chat-frontend` | `npm start` | CRA dev server with live reload and source maps. |
| `mistral-chat-frontend` | `npm run build` | Production build to `mistral-chat-frontend/build`. |
| `mistral-chat-frontend` | `npm test` | CRA test runner (Jest + React Testing Library). |

## Project structure
```
chat-mistral/
├── backend/                  # Express + Socket.IO bridge to the model server
├── mistral-chat-frontend/    # React UI
└── README.md
```

## Next steps
- Externalize the model endpoint, API key (if one is needed), and other settings through environment variables.
- Add deployment instructions (Docker, Render, etc.) once you have a target environment.
- Harden the backend (logging, request validation, timeouts) before exposing it beyond localhost.
