// Message bubble component — displays a single chat message with role-based styling
import React from 'react'

export default function MessageBubble({ role, content }) {
  /** Render a chat bubble with different styles for user and assistant messages */
  const isAssistant = role === 'assistant'
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl text-2xl leading-relaxed ${
        isAssistant
          ? 'bg-indigo-100 text-indigo-900'
          : 'bg-gray-800 text-white'
      }`}>
        {content}
      </div>
    </div>
  )
}
