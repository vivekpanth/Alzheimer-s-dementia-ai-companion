// Dashboard page — caregiver view of session summary, mood chart, and concern alerts
import React, { useState, useEffect } from 'react'
import MoodChart from '../components/MoodChart.jsx'
import ConcernAlert from '../components/ConcernAlert.jsx'
import { getReport } from '../api/client.js'

export default function Dashboard() {
  /** Caregiver dashboard showing daily report, mood trend, and concern flags */
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /** Fetch the latest session report on page load */
    // TODO Phase 3: replace with real API call
    setTimeout(() => {
      setReport({
        summary: 'Session pipeline not yet connected.',
        mood_trend: ['neutral'],
        concerns: []
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div className="p-8 text-gray-500">Loading report...</div>

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Daily Report</h1>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Session Summary</h2>
        <p className="text-gray-700">{report.summary}</p>
      </div>
      <MoodChart moodTrend={report.mood_trend} />
      {report.concerns.map((c, i) => <ConcernAlert key={i} concern={c} />)}
    </div>
  )
}
