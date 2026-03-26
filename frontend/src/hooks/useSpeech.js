// useSpeech hook — Web Speech API hook for voice input (STT) and voice output (TTS)
import { useState, useCallback, useRef, useEffect } from 'react'

export function useSpeech() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const utteranceRef = useRef(null)

  // Force-load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (e) {}
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return

    // Don't start listening if currently speaking
    if (window.speechSynthesis && window.speechSynthesis.speaking) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-AU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      setTranscript(e.results[0][0].transcript)
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    recognition.onerror = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setTranscript('')
    recognition.start()
    setListening(true)
  }, [])

  const speak = useCallback((text, onEnd) => {
    const synth = window.speechSynthesis
    if (!synth) {
      console.warn('speechSynthesis not available')
      if (onEnd) onEnd()
      return
    }

    // Step 1: Kill the microphone completely
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (e) {}
      recognitionRef.current = null
      setListening(false)
    }

    // Step 2: Cancel any queued speech
    synth.cancel()

    // Step 3: Create utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Pick a good voice
    const voices = synth.getVoices()
    if (voices.length > 0) {
      const preferred = voices.find(v => v.name.includes('Samantha'))
        || voices.find(v => v.lang.startsWith('en') && v.localService)
        || voices.find(v => v.lang.startsWith('en'))
      if (preferred) utterance.voice = preferred
    }

    utterance.onstart = () => {
      console.log('[TTS] Started speaking:', text.substring(0, 40) + '...')
      setSpeaking(true)
    }

    utterance.onend = () => {
      console.log('[TTS] Finished speaking')
      setSpeaking(false)
      if (onEnd) setTimeout(onEnd, 300) // small gap before listening starts
    }

    utterance.onerror = (e) => {
      console.error('[TTS] Error:', e.error)
      setSpeaking(false)
      if (onEnd) onEnd()
    }

    utteranceRef.current = utterance

    // Step 4: Speak — MUST be called synchronously from user gesture for first call
    console.log('[TTS] Calling synth.speak(), voices loaded:', voices.length)
    synth.speak(utterance)

    // Chrome bug: long speech gets stuck. Resume it periodically.
    const keepAlive = setInterval(() => {
      if (synth.speaking) {
        synth.pause()
        synth.resume()
      } else {
        clearInterval(keepAlive)
      }
    }, 5000)

    // Clean up interval when done
    const origOnEnd = utterance.onend
    utterance.onend = () => {
      clearInterval(keepAlive)
      origOnEnd()
    }
    utterance.onerror = (e) => {
      clearInterval(keepAlive)
      console.error('[TTS] Error:', e.error)
      setSpeaking(false)
      if (onEnd) onEnd()
    }
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return { listening, speaking, transcript, startListening, stopListening, speak, clearTranscript }
}
