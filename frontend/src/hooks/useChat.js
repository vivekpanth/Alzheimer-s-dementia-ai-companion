// useChat hook — manages chat session state including messages, loading, and session ID
import { useState, useCallback, useRef } from 'react'
import { sendMessage } from '../api/client.js'

export function useChat(userId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`sess_${Date.now()}`)
  const speakRef = useRef(null)

  const send = useCallback(async (text) => {
    /**Send a message to the backend and append the AI response to the message list.*/
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await sendMessage(userId, text, sessionId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Let me try again. Could you say that once more?",
      }])
    } finally {
      setLoading(false)
    }
  }, [userId, sessionId])

  // Allow adding an assistant message directly (for greetings, no API call needed)
  send.__addAssistantMessage = (text) => {
    setMessages(prev => [...prev, { role: 'assistant', content: text }])
  }

  return { messages, loading, sessionId, send }
}
