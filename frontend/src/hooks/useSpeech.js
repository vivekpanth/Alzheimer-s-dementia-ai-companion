// useSpeech hook — Web Speech API hook for voice input (STT) and voice output (TTS)
import { useState, useCallback } from 'react'

export function useSpeech() {
  /** Hook providing startListening (STT) and speak (TTS) functions via Web Speech API */
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  const startListening = useCallback(() => {
    /** Start speech recognition — supported in Chrome and Edge only */
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-AU'
    recognition.onresult = (e) => setTranscript(e.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }, [])

  const speak = useCallback((text) => {
    /** Read text aloud using browser built-in TTS at a gentle pace */
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [])

  return { listening, transcript, startListening, speak }
}
