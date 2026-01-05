// App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function CopyButton({ text, className, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button onClick={handleCopy} className={`copy-button ${className || ''}`}>
      {copied ? (
        <span>✓ Copied!</span>
      ) : (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4v12h12V4H8zm11 11H9V5h10v10zm-3-14H4v12h2V3h10V1zM6 17h2v4h12V9h-2v10H6v-2z" fill="currentColor"/>
          </svg>
          {label && <span style={{ marginLeft: '8px' }}>{label}</span>}
        </>
      )}
    </button>
  );
}

function App() {
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  useEffect(() => {
    socketRef.current = io('http://localhost:9000');

    socketRef.current.on('chat response', (chunk) => {
      setConversations(prev => {
        if (!prev.length) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          response: updated[updated.length - 1].response + chunk,
        };
        return updated;
      });
    });

    socketRef.current.on('response complete', () => {
      setIsGenerating(false);
    });

    socketRef.current.on('response stopped', () => {
      setConversations(prev => {
        if (!prev.length) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          response: updated[updated.length - 1].response + ' [stopped]',
        };
        return updated;
      });
      setIsGenerating(false);
    });

    socketRef.current.on('error', (error) => {
      setConversations(prev => {
        if (!prev.length) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          response: updated[updated.length - 1].response + error,
        };
        return updated;
      });
      setIsGenerating(false);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    setConversations(prev => [...prev, { prompt: input, response: '' }]);
    socketRef.current.emit('chat message', input);
    setInput('');
    setIsGenerating(true);
  };

  const stopGeneration = () => {
    socketRef.current.emit('stop response');
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="messages-container">
          {conversations.map((conv, i) => (
            <div key={i} className="conversation">
              <div className="message user">
                <div className="message-content">
                  <div className="avatar">👤</div>
                  <div className="text">{conv.prompt}</div>
                </div>
              </div>
              <div className="message assistant">
                <div className="message-content">
                  <div className="avatar">🤖</div>
                  <div className="text">
                    <div className="response-actions response-actions-top">
                      <CopyButton text={conv.response} className="copy-response" label="Copy response" />
                    </div>
                    <ReactMarkdown
                      className="markdown-content"
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const codeText = String(children).replace(/\n$/, '');
                          
                          return !inline ? (
                            <div className="code-block-wrapper">
                              <div className="code-block-header">
                                {language && <span className="code-language">{language}</span>}
                                <CopyButton 
                                  text={codeText} 
                                  label="Copy code"
                                />
                              </div>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={language}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  padding: '1rem',
                                  background: 'transparent'
                                }}
                                {...props}
                              >
                                {codeText}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {conv.response || ''}
                    </ReactMarkdown>
                    <div className="response-actions response-actions-bottom">
                      <CopyButton 
                        text={conv.response} 
                        className="copy-response" 
                        label="Copy full response with markdown"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isGenerating && sendMessage()}
            placeholder="Type your message here..."
            className="message-input"
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button onClick={stopGeneration} className="stop-button">
              Stop
            </button>
          ) : (
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
