// Mood chart component — displays patient mood trend using Recharts bar chart
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function MoodChart({ moodTrend }) {
  /** Render a bar chart of mood values across the session turns */
  const moodScore = { happy: 4, neutral: 3, confused: 2, distressed: 1 }
  const data = moodTrend.map((mood, i) => ({
    turn: i + 1,
    score: moodScore[mood] || 3,
    mood,
  }))

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Mood Trend</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="turn" label={{ value: 'Turn', position: 'insideBottom' }} />
          <YAxis
            domain={[0, 4]}
            tickFormatter={(v) => ['', 'Distressed', 'Confused', 'Neutral', 'Happy'][v] || ''}
          />
          <Tooltip formatter={(v, n, p) => [p.payload.mood, 'Mood']} />
          <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
