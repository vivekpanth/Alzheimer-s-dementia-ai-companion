// Chat page — patient-facing voice and text conversation interface
import React, { useState } from 'react'
import MessageBubble from '../components/MessageBubble.jsx'
import VoiceInput from '../components/VoiceInput.jsx'
import { sendMessage } from '../api/client.js'

export default function Chat() {
  /** Patient chat interface with large text, voice input, and TTS output */
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your companion. How are you feeling today?' }
  ])
  const [loading, setLoading] = useState(false)

  const handleSend = async (text) => {
    /** Send a message and display the AI response */
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    // TODO Phase 3: replace with real API call via sendMessage()
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Agent pipeline not yet connected.' }])
      setLoading(false)
    }, 500)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Companion</h1>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => <MessageBubble key={i} role={m.role} content={m.content} />)}
        {loading && <p className="text-gray-400 text-2xl">Thinking...</p>}
      </div>
      <VoiceInput onSubmit={handleSend} />
    </div>
  )
}
