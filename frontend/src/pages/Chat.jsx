// Chat page — patient-facing conversational AI companion interface
import React, { useState, useEffect, useRef } from 'react'
import MessageBubble from '../components/MessageBubble.jsx'
import { useChat } from '../hooks/useChat.js'
import { useSpeech } from '../hooks/useSpeech.js'

const PATIENT_ID = localStorage.getItem('patient_id') || 'patient_001'

const GREETINGS = [
  "Hello! It's so lovely to see you today. How are you feeling?",
  "Good to see you! I was just thinking about our last chat. How are you today?",
  "Hello there! I'm so glad you're here. What's on your mind today?",
]

export default function Chat() {
  const { messages, loading, send } = useChat(PATIENT_ID)
  const { listening, transcript, startListening, speak, clearTranscript } = useSpeech()
  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState('voice') // 'voice' or 'text'
  const [textInput, setTextInput] = useState('')
  const bottomRef = useRef(null)
  const prevMsgCount = useRef(0)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, listening])

  // Auto-read every NEW assistant message aloud
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant') {
        speak(last.content)
      }
    }
    prevMsgCount.current = messages.length
  }, [messages, speak])

  // Auto-send when speech recognition ends with a transcript
  useEffect(() => {
    if (!listening && transcript && mode === 'voice') {
      send(transcript)
      clearTranscript()
    }
  }, [listening, transcript, mode, send, clearTranscript])

  const handleStart = () => {
    setStarted(true)
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
    speak(greeting)
    // Add greeting as first message manually since it doesn't go through the backend
    send.__addAssistantMessage(greeting)
  }

  const handleTextSend = () => {
    if (textInput.trim()) {
      send(textInput.trim())
      setTextInput('')
    }
  }

  // Start conversation screen — one big button, nothing else
  if (!started) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, Arial, sans-serif', padding: '32px',
        }}
      >
        <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', textAlign: 'center' }}>
          Your Companion
        </p>
        <p style={{ fontSize: '22px', color: '#64748b', marginBottom: '48px', textAlign: 'center', maxWidth: '400px' }}>
          Press the button below and I will start talking with you.
        </p>
        <button
          onClick={handleStart}
          style={{
            width: '200px', height: '200px', borderRadius: '50%',
            backgroundColor: '#4f46e5', color: 'white', border: 'none',
            fontSize: '24px', fontWeight: 'bold', cursor: 'pointer',
            fontFamily: 'system-ui, Arial, sans-serif',
            boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
          }}
        >
          Start Conversation
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        backgroundColor: '#ffffff', fontFamily: 'system-ui, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        backgroundColor: '#4f46e5', color: 'white', padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '26px', fontWeight: 'bold' }}>Your Companion</span>
        <button
          onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
            border: 'none', borderRadius: '8px', padding: '8px 16px',
            fontSize: '16px', cursor: 'pointer',
          }}
        >
          {mode === 'voice' ? 'Switch to Text' : 'Switch to Voice'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div style={{ fontSize: '26px', color: '#6b7280', padding: '8px 16px' }}>
              Thinking...
            </div>
          )}
          {listening && (
            <div style={{ fontSize: '26px', color: '#4f46e5', padding: '8px 16px' }}>
              Listening...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid #e5e7eb', padding: '20px',
        backgroundColor: '#f9fafb',
      }}>
        {mode === 'voice' ? (
          /* Voice mode — one big microphone button */
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={startListening}
              disabled={listening || loading}
              aria-label="Speak to your companion"
              style={{
                width: '100px', height: '100px', borderRadius: '50%',
                backgroundColor: listening ? '#6366f1' : loading ? '#a5b4fc' : '#4f46e5',
                color: 'white', border: 'none', fontSize: '42px',
                cursor: listening || loading ? 'not-allowed' : 'pointer',
                boxShadow: listening ? '0 0 0 8px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              {listening ? '...' : '🎤'}
            </button>
          </div>
        ) : (
          /* Text mode — input field + send button */
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              placeholder="Type your message..."
              style={{
                flex: 1, border: '1px solid #d1d5db', borderRadius: '12px',
                padding: '14px 18px', fontSize: '24px',
                fontFamily: 'system-ui, Arial, sans-serif',
              }}
            />
            <button
              onClick={handleTextSend}
              disabled={loading || !textInput.trim()}
              style={{
                minWidth: '80px', height: '80px', borderRadius: '12px',
                backgroundColor: '#4f46e5', color: 'white', border: 'none',
                fontSize: '22px', fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'system-ui, Arial, sans-serif',
                opacity: loading || !textInput.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
