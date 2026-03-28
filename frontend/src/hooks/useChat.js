// useChat hook — manages chat session state including messages, loading, session ID, and session end
import { useState, useCallback, useRef } from 'react'
import { sendMessage, endSession as endSessionApi } from '../api/client.js'

export function useChat(userId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)
  const [sessionId] = useState(`sess_${Date.now()}`)

  const send = useCallback(async (text) => {
    /**Send a message to the backend and append the AI response to the message list.*/
    if (!text.trim() || sessionEnded) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await sendMessage(userId, text, sessionId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Let me try again. Could you say that once more?",
      }])
    } finally {
      setLoading(false)
    }
  }, [userId, sessionId, sessionEnded])

  const endSession = useCallback(async () => {
    /**End the session, generate a report, and return the summary.*/
    if (sessionEnded) return
    setSessionEnded(true)
    try {
      const res = await endSessionApi(userId, sessionId)
      setSessionSummary(res.data)
      return res.data
    } catch {
      // Session may have no messages yet — still mark as ended
      return null
    }
  }, [userId, sessionId, sessionEnded])

  // Allow adding an assistant message directly (for greetings, no API call needed)
  send.__addAssistantMessage = (text) => {
    setMessages(prev => [...prev, { role: 'assistant', content: text }])
  }

  return { messages, loading, sessionId, sessionEnded, sessionSummary, send, endSession }
}
