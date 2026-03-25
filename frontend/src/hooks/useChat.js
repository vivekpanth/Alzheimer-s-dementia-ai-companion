// useChat hook — manages chat session state including messages, loading, and session ID
import { useState, useCallback } from 'react'
import { sendMessage } from '../api/client.js'

export function useChat(userId) {
  /** Hook for managing chat state — messages list, loading flag, and session ID */
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`sess_${Date.now()}`)

  const send = useCallback(async (text) => {
    /** Send a message to the backend and append the AI response to the message list */
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await sendMessage(userId, text, sessionId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not connect. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }, [userId, sessionId])

  return { messages, loading, sessionId, send }
}
