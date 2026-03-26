// Chat page — patient-facing voice and text conversation interface
import React, { useEffect, useRef } from 'react'
import MessageBubble from '../components/MessageBubble.jsx'
import VoiceInput from '../components/VoiceInput.jsx'
import { useChat } from '../hooks/useChat.js'
import { useSpeech } from '../hooks/useSpeech.js'

// Patient ID — in production this would come from caregiver login/session
const PATIENT_ID = localStorage.getItem('patient_id') || 'patient_001'

export default function Chat() {
  const { messages, loading, send } = useChat(PATIENT_ID)
  const { speak } = useSpeech()
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-read every new assistant message aloud
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant') {
      speak(last.content)
    }
  }, [messages, speak])

  const handleSend = (text) => {
    if (text.trim()) send(text)
  }

  return (
    <div
      className="flex flex-col h-screen bg-white"
      style={{ fontFamily: 'system-ui, Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-indigo-700 text-white px-6 py-4">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          Your Companion
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <MessageBubble
            role="assistant"
            content="Hello! I am so glad you are here. How are you feeling today?"
          />
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div style={{ fontSize: '26px', color: '#6b7280', padding: '8px 16px' }}>
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <VoiceInput onSubmit={handleSend} disabled={loading} />
      </div>
    </div>
  )
}
