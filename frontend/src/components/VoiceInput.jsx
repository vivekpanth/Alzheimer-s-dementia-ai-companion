// Voice input component — microphone button using Web Speech API for patient speech-to-text
import React, { useState } from 'react'

export default function VoiceInput({ onSubmit }) {
  /** Large microphone button that listens for patient speech and submits transcribed text */
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('')

  const startListening = () => {
    /** Start Web Speech API recognition if supported in browser */
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input requires Chrome or Edge browser.')
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-AU'
    recognition.onresult = (e) => setText(e.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  return (
    <div className="flex gap-3 items-center">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or use microphone..."
        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-2xl"
      />
      <button
        onClick={startListening}
        aria-label="Start voice input"
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl ${
          listening ? 'bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        🎤
      </button>
      <button
        onClick={() => { onSubmit(text); setText('') }}
        className="bg-gray-800 text-white px-6 py-3 rounded-lg text-xl"
      >
        Send
      </button>
    </div>
  )
}
