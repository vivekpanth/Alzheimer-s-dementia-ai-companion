// Chat page — voice-first conversational AI companion interface
import React, { useState, useEffect, useRef } from 'react'
import MessageBubble from '../components/MessageBubble.jsx'
import { useChat } from '../hooks/useChat.js'
import { useSpeech } from '../hooks/useSpeech.js'
import { useAuth } from '../context/AuthContext.jsx'

const GREETINGS = [
  "Hello! It's so lovely to see you today. How are you feeling?",
  "Good to see you! I've been looking forward to our chat. How are you today?",
  "Hello there, it's wonderful to have you here. What's on your mind today?",
]

const INACTIVITY_MS = 3 * 60 * 1000  // 3 minutes

export default function Chat() {
  const { patientId } = useAuth()
  const { messages, loading, sessionEnded, sessionSummary, send, endSession } = useChat(patientId || 'patient_001')
  const { listening, speaking, transcript, startListening, stopListening, speak, clearTranscript } = useSpeech()
  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState('voice')
  const [textInput, setTextInput] = useState('')
  const [ending, setEnding] = useState(false)
  const bottomRef = useRef(null)
  const prevMsgCount = useRef(0)
  const inactivityTimer = useRef(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, listening, speaking])

  // Speak new assistant messages and restart listening
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && prevMsgCount.current > 0) {
        if (mode === 'voice') {
          speak(last.content, () => { if (!sessionEnded) startListening() })
        } else {
          speak(last.content)
        }
      }
    }
    prevMsgCount.current = messages.length
  }, [messages, speak, startListening, mode, sessionEnded])

  // Auto-send when patient finishes speaking
  useEffect(() => {
    if (!listening && transcript) {
      stopListening()
      send(transcript)
      clearTranscript()
    }
  }, [listening, transcript, send, clearTranscript, stopListening])

  // Reset inactivity timer on each new message
  useEffect(() => {
    if (!started || sessionEnded) return
    clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      handleEndSession()
    }, INACTIVITY_MS)
    return () => clearTimeout(inactivityTimer.current)
  }, [messages, started, sessionEnded])

  const handleStart = () => {
    setStarted(true)
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
    send.__addAssistantMessage(greeting)
    speak(greeting, () => { if (mode === 'voice') startListening() })
  }

  const handleEndSession = async () => {
    if (ending || sessionEnded) return
    setEnding(true)
    clearTimeout(inactivityTimer.current)
    stopListening()
    speak("It was wonderful talking with you today. Take care!", () => {})
    await endSession()
    setEnding(false)
  }

  const handleTextSend = () => {
    if (textInput.trim()) {
      send(textInput.trim())
      setTextInput('')
    }
  }

  const getStatus = () => {
    if (ending) return 'Ending session...'
    if (speaking) return 'Companion is speaking...'
    if (listening) return 'Listening to you...'
    if (loading) return 'Thinking...'
    return mode === 'voice' ? 'Tap the microphone to speak' : ''
  }

  // ── Session ended screen ──
  if (sessionEnded) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, Arial, sans-serif', padding: '32px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <p style={{ fontSize: '36px', marginBottom: '8px' }}>💙</p>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
            Session Complete
          </h2>
          {sessionSummary && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Session Summary</p>
              <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.7', margin: '0 0 16px' }}>{sessionSummary.summary}</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Duration</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#4f46e5', margin: '2px 0 0' }}>{sessionSummary.duration_minutes} min</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Mood</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#4f46e5', margin: '2px 0 0', textTransform: 'capitalize' }}>
                    {sessionSummary.mood_trend?.slice(-1)[0] || 'neutral'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/dashboard" style={{
              display: 'block', backgroundColor: '#4f46e5', color: 'white',
              padding: '16px', borderRadius: '12px', fontSize: '18px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              View Full Report & Dashboard
            </a>
            <a href="/chat" style={{
              display: 'block', backgroundColor: 'white', color: '#4f46e5',
              padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
              textDecoration: 'none', border: '2px solid #4f46e5',
            }}>
              Start New Conversation
            </a>
            <a href="/patient" style={{
              display: 'block', backgroundColor: 'white', color: '#6b7280',
              padding: '14px', borderRadius: '12px', fontSize: '16px',
              textDecoration: 'none', border: '1px solid #e5e7eb',
            }}>
              Back to Patient List
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Start screen ──
  if (!started) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, Arial, sans-serif', padding: '32px',
      }}>
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

  // ── Active chat screen ──
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: '#ffffff', fontFamily: 'system-ui, Arial, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#4f46e5', color: 'white', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '26px', fontWeight: 'bold' }}>Your Companion</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
              border: 'none', borderRadius: '10px', padding: '10px 16px',
              fontSize: '16px', cursor: 'pointer', minHeight: '48px',
            }}
          >
            {mode === 'voice' ? 'Text' : 'Voice'}
          </button>
          <button
            onClick={handleEndSession}
            disabled={ending}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: '10px',
              padding: '10px 16px', fontSize: '16px', cursor: ending ? 'not-allowed' : 'pointer',
              minHeight: '48px', opacity: ending ? 0.6 : 1,
            }}
          >
            {ending ? 'Ending…' : 'End Session'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Status */}
      {getStatus() && (
        <div
          role="status"
          aria-live="polite"
          style={{
            textAlign: 'center', padding: '12px', fontSize: '22px',
            color: speaking ? '#3730a3' : listening ? '#065f46' : '#374151',
            fontWeight: '500',
          }}
        >
          {getStatus()}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px', backgroundColor: '#f9fafb' }}>
        {mode === 'voice' ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={startListening}
              disabled={listening || loading || speaking}
              aria-label="Speak to your companion"
              style={{
                width: '100px', height: '100px', borderRadius: '50%',
                backgroundColor: listening ? '#059669' : speaking ? '#a5b4fc' : loading ? '#a5b4fc' : '#4f46e5',
                color: 'white', border: 'none', fontSize: '42px',
                cursor: listening || loading || speaking ? 'not-allowed' : 'pointer',
                boxShadow: listening ? '0 0 0 8px rgba(5, 150, 105, 0.3)' : 'none',
              }}
            >
              {listening ? '👂' : '🎤'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              placeholder="Type your message..."
              style={{
                flex: 1, border: '1px solid #d1d5db', borderRadius: '12px',
                padding: '14px 18px', fontSize: '24px', fontFamily: 'system-ui, Arial, sans-serif',
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
