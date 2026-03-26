// useSpeech hook — Web Speech API hook for voice input (STT) and voice output (TTS)
import { useState, useCallback, useRef } from 'react'

export function useSpeech() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const onSpeechEndRef = useRef(null)

  const startListening = useCallback(() => {
    /**Start speech recognition — supported in Chrome and Edge only.*/
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    // Cancel any TTS currently playing so it doesn't overlap
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-AU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setTranscript('') // Clear previous transcript
  }, [])

  const speak = useCallback((text, onEnd) => {
    /**Read text aloud using browser TTS. Calls onEnd when finished speaking.*/
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd()
      return
    }
    window.speechSynthesis.cancel() // Stop any in-progress speech
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => {
      setSpeaking(false)
      if (onEnd) onEnd()
    }
    utterance.onerror = () => {
      setSpeaking(false)
      if (onEnd) onEnd()
    }
    window.speechSynthesis.speak(utterance)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return { listening, speaking, transcript, startListening, speak, clearTranscript }
}
