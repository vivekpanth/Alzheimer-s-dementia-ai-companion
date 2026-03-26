// Concern alert component — displays a flagged distress topic for the caregiver
import React from 'react'

export default function ConcernAlert({ concern }) {
  /** Render a highlighted alert card for a repeated distress concern */
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-3 flex gap-3 items-start">
      <span className="text-amber-500 text-xl">⚠️</span>
      <div>
        <p className="font-medium text-amber-900">{concern.text}</p>
        <p className="text-sm text-amber-700 mt-1">
          {concern.timestamp} · {concern.occurrences_this_week}x this week
        </p>
      </div>
    </div>
  )
}
