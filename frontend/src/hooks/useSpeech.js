// useSpeech hook — Web Speech API hook for voice input (STT) and voice output (TTS)
import { useState, useCallback, useRef, useEffect } from 'react'

export function useSpeech() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voicesReady, setVoicesReady] = useState(false)
  const recognitionRef = useRef(null)

  // Ensure voices are loaded — Chrome loads them async
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const synth = window.speechSynthesis

    const loadVoices = () => {
      const voices = synth.getVoices()
      if (voices.length > 0) {
        setVoicesReady(true)
      }
    }

    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => { synth.onvoiceschanged = null }
  }, [])

  const startListening = useCallback(() => {
    /**Start speech recognition — supported in Chrome and Edge only.*/
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return

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
    setTranscript('')
  }, [])

  const speak = useCallback((text, onEnd) => {
    /**Read text aloud using browser TTS. Calls onEnd when finished speaking.*/
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd()
      return
    }

    const synth = window.speechSynthesis

    // Cancel anything currently playing
    synth.cancel()

    // Small delay after cancel — Chrome needs this to not swallow the next utterance
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Pick an English voice if available
      const voices = synth.getVoices()
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.default)
        || voices.find(v => v.lang.startsWith('en'))
      if (englishVoice) utterance.voice = englishVoice

      utterance.onstart = () => {
        setSpeaking(true)
      }
      utterance.onend = () => {
        setSpeaking(false)
        if (onEnd) onEnd()
      }
      utterance.onerror = (e) => {
        console.warn('TTS error:', e.error)
        setSpeaking(false)
        if (onEnd) onEnd()
      }

      synth.speak(utterance)

      // Chrome bug workaround: long utterances get paused after ~15s
      // Resume periodically to prevent this
      const resumeInterval = setInterval(() => {
        if (!synth.speaking) {
          clearInterval(resumeInterval)
        } else {
          synth.resume()
        }
      }, 10000)

      utterance.onend = () => {
        clearInterval(resumeInterval)
        setSpeaking(false)
        if (onEnd) onEnd()
      }
    }, 100)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return { listening, speaking, transcript, startListening, speak, clearTranscript, voicesReady }
}
