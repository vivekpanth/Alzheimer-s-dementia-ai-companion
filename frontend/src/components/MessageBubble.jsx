// Message bubble component — displays a single chat message with role-based styling
import React from 'react'

export default function MessageBubble({ role, content }) {
  /** Render a chat bubble with different styles for user and assistant messages */
  const isAssistant = role === 'assistant'
  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
      role="log"
      aria-label={isAssistant ? 'Companion message' : 'Your message'}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '16px 20px',
          borderRadius: '16px',
          fontSize: '24px',
          lineHeight: '1.6',
          backgroundColor: isAssistant ? '#e0e7ff' : '#1f2937',
          color: isAssistant ? '#1e1b4b' : '#ffffff',
        }}
      >
        {content}
      </div>
    </div>
  )
}
